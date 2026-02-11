'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { login as authLogin, logout as authLogout, getSession } from './auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function register(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const companyName = formData.get('companyName') as string;

  if (!email || !password || !companyName) {
    return { error: 'Email, password, and company name are required' };
  }

  const userCountResult = await db.select({ count: sql`count(*)` }).from(users).get();
  const userCount = (userCountResult as { count: number })?.count || 0;

  if (userCount > 0) {
    return { error: 'Registration is closed. Please contact an administrator.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const apiToken = crypto.randomUUID();
  
  const result = await db.insert(users).values({
    email,
    password: hashedPassword,
    companyName,
    role: 'superadmin',
    apiToken,
  }).returning().get();

  await authLogin({ id: result.id, email: result.email, role: result.role, companyName: result.companyName });
  redirect('/');
}

export async function createTenant(prevState: unknown, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'superadmin') {
    return { error: 'Unauthorized' };
  }

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const companyName = formData.get('companyName') as string;
  const role = (formData.get('role') as string) || 'admin';

  if (!email || !password || !companyName) {
    return { error: 'Email, password, and company name are required' };
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    return { error: 'User already exists' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const apiToken = crypto.randomUUID();

  await db.insert(users).values({
    email,
    password: hashedPassword,
    companyName,
    role,
    apiToken,
  }).run();

  revalidatePath('/admin');
  return { success: 'Tenant created successfully' };
}

export async function login(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    return { error: 'Invalid email or password' };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { error: 'Invalid email or password' };
  }

  await authLogin({ id: user.id, email: user.email, role: user.role, companyName: user.companyName });
  redirect('/');
}

export async function logout() {
  await authLogout();
  redirect('/login');
}
