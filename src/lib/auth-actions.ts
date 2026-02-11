'use server';

import { db } from '@/db';
import { users, tenants } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';
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

  // Create first tenant
  const tenant = await db.insert(tenants).values({ name: companyName }).returning().get();

  const hashedPassword = await bcrypt.hash(password, 10);
  const apiToken = crypto.randomUUID();
  
  const result = await db.insert(users).values({
    tenantId: tenant.id,
    email,
    password: hashedPassword,
    role: 'superadmin',
    apiToken,
  }).returning().get();

  await authLogin({ 
    id: result.id, 
    tenantId: tenant.id,
    email: result.email, 
    role: result.role, 
    companyName: tenant.name 
  });
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

  const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
  if (existingUser) {
    return { error: 'User already exists' };
  }

  let tenant = await db.select().from(tenants).where(eq(tenants.name, companyName)).get();
  if (!tenant) {
    tenant = await db.insert(tenants).values({ name: companyName }).returning().get();
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const apiToken = crypto.randomUUID();

  await db.insert(users).values({
    tenantId: tenant.id,
    email,
    password: hashedPassword,
    role,
    apiToken,
  }).run();

  revalidatePath('/admin');
  return { success: 'User and/or Tenant created successfully' };
}

export async function updateUserEmail(userId: number, newEmail: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'superadmin') {
    throw new Error('Unauthorized');
  }

  await db.update(users).set({ email: newEmail }).where(eq(users.id, userId)).run();
  revalidatePath('/admin');
  return { success: true };
}

export async function resetUserPassword(userId: number, newPassword: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'superadmin') {
    throw new Error('Unauthorized');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId)).run();
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteUser(userId: number) {
  const session = await getSession();
  if (!session || session.user.role !== 'superadmin') {
    throw new Error('Unauthorized');
  }

  // Prevent self-deletion
  if (session.user.id === userId) {
    return { error: 'You cannot delete yourself' };
  }

  await db.delete(users).where(eq(users.id, userId)).run();
  revalidatePath('/admin');
  return { success: true };
}

export async function updateUserTenant(userId: number, companyName: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'superadmin') {
    throw new Error('Unauthorized');
  }

  let tenant = await db.select().from(tenants).where(eq(tenants.name, companyName)).get();
  if (!tenant) {
    tenant = await db.insert(tenants).values({ name: companyName }).returning().get();
  }

  await db.update(users).set({ tenantId: tenant.id }).where(eq(users.id, userId)).run();
  revalidatePath('/admin');
  return { success: true };
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

  const tenant = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).get();
  if (!tenant) {
    return { error: 'Tenant not found' };
  }

  await authLogin({ 
    id: user.id, 
    tenantId: user.tenantId,
    email: user.email, 
    role: user.role, 
    companyName: tenant.name 
  });
  redirect('/');
}

export async function logout() {
  await authLogout();
  redirect('/login');
}
