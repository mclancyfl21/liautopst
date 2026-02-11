'use server';

import { db } from '@/db';
import { playlists, posts, channels } from '@/db/schema';
import { eq, or, sql, and } from 'drizzle-orm';
import { enforceEmojis } from './utils/emoji-enforcement';
import { revalidatePath } from 'next/cache';
import { getSession } from './auth';

async function getUserId() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session.user.id;
}

export async function getChannels() {
  const userId = await getUserId();
  return await db.select().from(channels).where(eq(channels.userId, userId)).all();
}

export async function createChannel(
  name: string, 
  type: 'playlist' | 'random', 
  playlistId?: number | null,
  scheduleType: 'daily' | 'weekly' | 'monthly' = 'daily',
  scheduledTime: string = '09:00'
) {
  const userId = await getUserId();
  await db.insert(channels).values({ 
    userId,
    name, 
    type, 
    playlistId,
    scheduleType,
    scheduledTime
  }).run();
  revalidatePath('/');
}

export async function deleteChannel(id: number) {
  const userId = await getUserId();
  await db.delete(channels).where(and(eq(channels.id, id), eq(channels.userId, userId))).run();
  revalidatePath('/');
}

export async function toggleChannel(id: number, isActive: boolean) {
  const userId = await getUserId();
  await db.update(channels).set({ isActive }).where(and(eq(channels.id, id), eq(channels.userId, userId))).run();
  revalidatePath('/');
}

export async function createPlaylist(name: string, description?: string) {
  const userId = await getUserId();
  await db.insert(playlists).values({ userId, name, description }).run();
  revalidatePath('/playlists');
}

export async function getPlaylists() {
  const userId = await getUserId();
  return await db.select().from(playlists).where(eq(playlists.userId, userId)).all();
}

export async function updatePlaylist(id: number, name: string, description?: string) {
  const userId = await getUserId();
  await db.update(playlists)
    .set({ name, description })
    .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
    .run();
  revalidatePath('/playlists');
}

export async function deletePlaylist(id: number) {
  const userId = await getUserId();
  await db.update(posts)
    .set({ playlistId: null })
    .where(and(eq(posts.playlistId, id), eq(posts.userId, userId)))
    .run();
    
  await db.delete(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
    .run();
  revalidatePath('/playlists');
}

export async function addPostToPlaylist(postId: number, playlistId: number | null) {
  const userId = await getUserId();
  await db.update(posts)
    .set({ playlistId })
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
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
  const userId = await getUserId();
  const processedContent = enforceEmojis(content);
  
  await db.insert(posts).values({
    userId,
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
  const userId = await getUserId();
  const allPosts = await db.select().from(posts).where(eq(posts.userId, userId)).all();
  
  return {
    inventory: allPosts.filter(p => p.status === 'inventory'),
    posted: allPosts.filter(p => p.status === 'posted'),
  };
}

export async function updatePostStatus(id: number, status: 'inventory' | 'posted' | 'archived') {
  const userId = await getUserId();
  await db.update(posts)
    .set({ status })
    .where(and(eq(posts.id, id), eq(posts.userId, userId)))
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
  const userId = await getUserId();
  const processedContent = enforceEmojis(content);
  await db.update(posts)
    .set({ 
      content: processedContent,
      imageUrl: imageUrl === undefined ? undefined : imageUrl,
      playlistId: playlistId === undefined ? undefined : playlistId,
      scheduledAt: scheduledAt === undefined ? undefined : scheduledAt,
      isScheduleActive: isScheduleActive === undefined ? undefined : isScheduleActive
    })
    .where(and(eq(posts.id, id), eq(posts.userId, userId)))
    .run();
  revalidatePath('/');
}

export async function postNow(id: number) {
  const userId = await getUserId();
  const post = await db.select().from(posts).where(and(eq(posts.id, id), eq(posts.userId, userId))).get();
  if (!post) throw new Error('Post not found');

  console.log(`[ACTION] Posting immediate: ${post.id}`);
  
  await db.update(posts)
    .set({ 
      status: 'posted', 
      postedAt: new Date(),
      playlistId: null,
      scheduledAt: null
    })
    .where(and(eq(posts.id, id), eq(posts.userId, userId)))
    .run();

  revalidatePath('/');
}

export async function deletePost(id: number) {
  const userId = await getUserId();
  await db.delete(posts)
    .where(and(eq(posts.id, id), eq(posts.userId, userId)))
    .run();
  revalidatePath('/');
}

