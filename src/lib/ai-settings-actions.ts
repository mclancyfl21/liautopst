'use server';

import { db } from '@/db';
import { aiProviders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from './auth';

async function getTenantId() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session.user.tenantId;
}

export async function getAiProviders() {
  const tenantId = await getTenantId();
  return await db.select().from(aiProviders).where(eq(aiProviders.tenantId, tenantId)).all();
}

export async function createAiProvider(name: string, endpoint: string, apiKey: string | null, model: string, systemPrompt?: string, userPrompt?: string) {
  const tenantId = await getTenantId();
  
  // Check if this is the first provider, if so make it active
  const existing = await db.select().from(aiProviders).where(eq(aiProviders.tenantId, tenantId)).all();
  const isActive = existing.length === 0;

  await db.insert(aiProviders).values({
    tenantId,
    name,
    endpoint,
    apiKey,
    model,
    systemPrompt,
    userPrompt,
    isActive,
  }).run();

  revalidatePath('/settings');
}

export async function deleteAiProvider(id: number) {
  const tenantId = await getTenantId();
  await db.delete(aiProviders).where(and(eq(aiProviders.id, id), eq(aiProviders.tenantId, tenantId))).run();
  revalidatePath('/settings');
}

export async function setActiveAiProvider(id: number) {
  const tenantId = await getTenantId();
  
  // Transaction-like logic: Set all to inactive, then set specific one to active
  await db.update(aiProviders)
    .set({ isActive: false })
    .where(eq(aiProviders.tenantId, tenantId))
    .run();

  await db.update(aiProviders)
    .set({ isActive: true })
    .where(and(eq(aiProviders.id, id), eq(aiProviders.tenantId, tenantId)))
    .run();

  revalidatePath('/settings');
}
