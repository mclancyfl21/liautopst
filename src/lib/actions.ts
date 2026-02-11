'use server';

import { db } from '@/db';
import { playlists, posts, channels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { enforceEmojis } from './utils/emoji-enforcement';
import { revalidatePath } from 'next/cache';
import { getSession, getTenantId } from './auth';
import { postToLinkedIn } from './linkedin';

export async function getChannels() {
  const tenantId = await getTenantId();
  return await db.select().from(channels).where(eq(channels.tenantId, tenantId)).all();
}

export async function createChannel(
  name: string, 
  type: 'playlist' | 'random', 
  playlistId?: number | null,
  scheduleType: 'daily' | 'weekly' | 'monthly' = 'daily',
  scheduledTime: string = '09:00'
) {
  const tenantId = await getTenantId();
  await db.insert(channels).values({ 
    tenantId,
    name, 
    type, 
    playlistId,
    scheduleType,
    scheduledTime
  }).run();
  revalidatePath('/');
}

export async function deleteChannel(id: number) {
  const tenantId = await getTenantId();
  await db.delete(channels).where(and(eq(channels.id, id), eq(channels.tenantId, tenantId))).run();
  revalidatePath('/');
}

export async function toggleChannel(id: number, isActive: boolean) {
  const tenantId = await getTenantId();
  await db.update(channels).set({ isActive }).where(and(eq(channels.id, id), eq(channels.tenantId, tenantId))).run();
  revalidatePath('/');
}

export async function createPlaylist(name: string, description?: string) {
  const tenantId = await getTenantId();
  await db.insert(playlists).values({ tenantId, name, description }).run();
  revalidatePath('/playlists');
}

export async function getPlaylists() {
  const tenantId = await getTenantId();
  return await db.select().from(playlists).where(eq(playlists.tenantId, tenantId)).all();
}

export async function updatePlaylist(id: number, name: string, description?: string) {
  const tenantId = await getTenantId();
  await db.update(playlists)
    .set({ name, description })
    .where(and(eq(playlists.id, id), eq(playlists.tenantId, tenantId)))
    .run();
  revalidatePath('/playlists');
}

export async function deletePlaylist(id: number) {
  const tenantId = await getTenantId();
  await db.update(posts)
    .set({ playlistId: null })
    .where(and(eq(posts.playlistId, id), eq(posts.tenantId, tenantId)))
    .run();
    
  await db.delete(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.tenantId, tenantId)))
    .run();
  revalidatePath('/playlists');
}

export async function addPostToPlaylist(postId: number, playlistId: number | null) {
  const tenantId = await getTenantId();
  await db.update(posts)
    .set({ playlistId })
    .where(and(eq(posts.id, postId), eq(posts.tenantId, tenantId)))
    .run();
  revalidatePath('/');
}

export async function createPost(
  content: string, 
  imageUrl?: string, 
  scheduledAt?: Date | null, 
  isScheduleActive: boolean = true,
  playlistId?: number | null
) {
  const tenantId = await getTenantId();
  const processedContent = enforceEmojis(content);
  
  await db.insert(posts).values({
    tenantId,
    content: processedContent,
    imageUrl: imageUrl || null,
    status: 'inventory',
    scheduledAt: scheduledAt || null,
    isScheduleActive,
    playlistId: playlistId || null,
  }).run();

  revalidatePath('/');
}

export async function getPosts() {
  const tenantId = await getTenantId();
  const allPosts = await db.select().from(posts).where(eq(posts.tenantId, tenantId)).all();
  
  return {
    inventory: allPosts.filter(p => p.status === 'inventory'),
    posted: allPosts.filter(p => p.status === 'posted'),
  };
}

export async function updatePostStatus(id: number, status: 'inventory' | 'posted' | 'archived') {
  const tenantId = await getTenantId();
  await db.update(posts)
    .set({ status })
    .where(and(eq(posts.id, id), eq(posts.tenantId, tenantId)))
    .run();
  revalidatePath('/');
}

export async function updatePost(
  id: number, 
  content: string, 
  imageUrl?: string | null, 
  playlistId?: number | null, 
  scheduledAt?: Date | null,
  isScheduleActive?: boolean
) {
  const tenantId = await getTenantId();
  const processedContent = enforceEmojis(content);
  await db.update(posts)
    .set({ 
      content: processedContent,
      imageUrl: imageUrl === undefined ? undefined : imageUrl,
      playlistId: playlistId === undefined ? undefined : playlistId,
      scheduledAt: scheduledAt === undefined ? undefined : scheduledAt,
      isScheduleActive: isScheduleActive === undefined ? undefined : isScheduleActive
    })
    .where(and(eq(posts.id, id), eq(posts.tenantId, tenantId)))
    .run();
  revalidatePath('/');
}

export async function postNow(id: number) {
  const tenantId = await getTenantId();
  const post = await db.select().from(posts).where(and(eq(posts.id, id), eq(posts.tenantId, tenantId))).get();
  if (!post) throw new Error('Post not found');

  console.log(`[ACTION] Posting immediate: ${post.id}`);
  
  const result = await postToLinkedIn(post.content, post.imageUrl, tenantId);
  
  if (!result.success) {
    console.error(`[ACTION_ERROR] LinkedIn post failed: ${result.message}`);
    console.error(`[ACTION_DEBUG] Full Result:`, JSON.stringify(result, null, 2));
    throw new Error(`LinkedIn Error: ${result.message}`);
  }

  await db.update(posts)
    .set({ 
      status: 'posted', 
      postedAt: new Date(),
      playlistId: null,
      scheduledAt: null
    })
    .where(and(eq(posts.id, id), eq(posts.tenantId, tenantId)))
    .run();

  revalidatePath('/');
}

export async function deletePost(id: number) {
  const tenantId = await getTenantId();
  await db.delete(posts)
    .where(and(eq(posts.id, id), eq(posts.tenantId, tenantId)))
    .run();
  revalidatePath('/');
}
