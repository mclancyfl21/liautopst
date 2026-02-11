'use server';

import { db } from '@/db';
import { credentials } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from './auth';

async function getUserId() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session.user.id;
}

export async function getCredentials() {
  const userId = await getUserId();
  const creds = await db.select().from(credentials).where(eq(credentials.userId, userId)).all();
  return creds.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function updateCredential(key: string, value: string) {
  const userId = await getUserId();
  const existing = await db.select().from(credentials).where(and(eq(credentials.key, key), eq(credentials.userId, userId))).get();
  
  if (existing) {
    await db.update(credentials).set({ value, updatedAt: new Date() }).where(and(eq(credentials.key, key), eq(credentials.userId, userId))).run();
  } else {
    await db.insert(credentials).values({ userId, key, value }).run();
  }
  
  revalidatePath('/settings');
}

