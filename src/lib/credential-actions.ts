'use server';

import { db } from '@/db';
import { credentials } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession, getTenantId } from './auth';

export async function getCredentials(providedTenantId?: number) {
  const tenantId = providedTenantId || await getTenantId();
  const creds = await db.select().from(credentials).where(eq(credentials.tenantId, tenantId)).all();
  return creds.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function updateCredential(key: string, value: string) {
  const tenantId = await getTenantId();
  const existing = await db.select().from(credentials).where(and(eq(credentials.key, key), eq(credentials.tenantId, tenantId))).get();
  
  if (existing) {
    await db.update(credentials).set({ value, updatedAt: new Date() }).where(and(eq(credentials.key, key), eq(credentials.tenantId, tenantId))).run();
  } else {
    await db.insert(credentials).values({ tenantId, key, value }).run();
  }
  
  revalidatePath('/settings');
}

