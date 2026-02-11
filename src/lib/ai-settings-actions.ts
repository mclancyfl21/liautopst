'use server';

import { db } from '@/db';
import { aiProviders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from './auth';

async function getUserId() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session.user.id;
}

export async function getAiProviders() {
  const userId = await getUserId();
  return await db.select().from(aiProviders).where(eq(aiProviders.userId, userId)).all();
}

export async function createAiProvider(name: string, endpoint: string, apiKey: string | null, model: string, systemPrompt?: string, userPrompt?: string) {
  const userId = await getUserId();
  
  // Check if this is the first provider, if so make it active
  const existing = await db.select().from(aiProviders).where(eq(aiProviders.userId, userId)).all();
  const isActive = existing.length === 0;

  await db.insert(aiProviders).values({
    userId,
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
  const userId = await getUserId();
  await db.delete(aiProviders).where(and(eq(aiProviders.id, id), eq(aiProviders.userId, userId))).run();
  revalidatePath('/settings');
}

export async function setActiveAiProvider(id: number) {
  const userId = await getUserId();
  
  // Transaction-like logic: Set all to inactive, then set specific one to active
  await db.update(aiProviders)
    .set({ isActive: false })
    .where(eq(aiProviders.userId, userId))
    .run();

  await db.update(aiProviders)
    .set({ isActive: true })
    .where(and(eq(aiProviders.id, id), eq(aiProviders.userId, userId)))
    .run();

  revalidatePath('/settings');
}
