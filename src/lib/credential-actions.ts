'use server';

import { db } from '@/db';
import { credentials } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getCredentials() {
  const creds = await db.select().from(credentials).all();
  return creds.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function updateCredential(key: string, value: string) {
  const existing = await db.select().from(credentials).where(eq(credentials.key, key)).get();
  
  if (existing) {
    await db.update(credentials).set({ value, updatedAt: new Date() }).where(eq(credentials.key, key)).run();
  } else {
    await db.insert(credentials).values({ key, value }).run();
  }
  
  revalidatePath('/settings');
}
