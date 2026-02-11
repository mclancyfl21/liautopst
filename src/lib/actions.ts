'use server';

import { db } from '@/db';
import { playlists, posts, channels } from '@/db/schema';
import { eq, or, sql, and } from 'drizzle-orm';
import { enforceEmojis } from './utils/emoji-enforcement';
import { revalidatePath } from 'next/cache';

export async function getChannels() {
  return await db.select().from(channels).all();
}

export async function createChannel(
  name: string, 
  type: 'playlist' | 'random', 
  playlistId?: number | null,
  scheduleType: 'daily' | 'weekly' | 'monthly' = 'daily',
  scheduledTime: string = '09:00'
) {
  await db.insert(channels).values({ 
    name, 
    type, 
    playlistId,
    scheduleType,
    scheduledTime
  }).run();
  revalidatePath('/');
}

export async function deleteChannel(id: number) {
  await db.delete(channels).where(eq(channels.id, id)).run();
  revalidatePath('/');
}

export async function toggleChannel(id: number, isActive: boolean) {
  await db.update(channels).set({ isActive }).where(eq(channels.id, id)).run();
  revalidatePath('/');
}

export async function createPlaylist(name: string, description?: string) {
  await db.insert(playlists).values({ name, description }).run();
  revalidatePath('/playlists');
}

export async function getPlaylists() {
  return await db.select().from(playlists).all();
}

export async function updatePlaylist(id: number, name: string, description?: string) {
  await db.update(playlists)
    .set({ name, description })
    .where(eq(playlists.id, id))
    .run();
  revalidatePath('/playlists');
}

export async function deletePlaylist(id: number) {
  await db.update(posts)
    .set({ playlistId: null })
    .where(eq(posts.playlistId, id))
    .run();
    
  await db.delete(playlists)
    .where(eq(playlists.id, id))
    .run();
  revalidatePath('/playlists');
}

export async function addPostToPlaylist(postId: number, playlistId: number | null) {
  await db.update(posts)
    .set({ playlistId })
    .where(eq(posts.id, postId))
    .run();
  revalidatePath('/');
}

export async function createPost(content: string, imageUrl?: string) {
  const processedContent = enforceEmojis(content);
  
  await db.insert(posts).values({
    content: processedContent,
    imageUrl: imageUrl || null,
    status: 'inventory',
  }).run();

  revalidatePath('/');
}

export async function getPosts() {
  const allPosts = await db.select().from(posts).all();
  
  return {
    inventory: allPosts.filter(p => p.status === 'inventory'),
    posted: allPosts.filter(p => p.status === 'posted'),
  };
}

export async function updatePostStatus(id: number, status: 'inventory' | 'posted' | 'archived') {
  await db.update(posts)
    .set({ status })
    .where(eq(posts.id, id))
    .run();
  revalidatePath('/');
}

export async function updatePost(id: number, content: string, imageUrl?: string | null, playlistId?: number | null, scheduledAt?: Date | null) {
  const processedContent = enforceEmojis(content);
  await db.update(posts)
    .set({ 
      content: processedContent,
      imageUrl: imageUrl === undefined ? undefined : imageUrl,
      playlistId: playlistId === undefined ? undefined : playlistId,
      scheduledAt: scheduledAt === undefined ? undefined : scheduledAt
    })
    .where(eq(posts.id, id))
    .run();
  revalidatePath('/');
}

export async function postNow(id: number) {
  const post = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!post) throw new Error('Post not found');

  console.log(`[ACTION] Posting immediate: ${post.id}`);
  
  await db.update(posts)
    .set({ 
      status: 'posted', 
      postedAt: new Date(),
      playlistId: null,
      scheduledAt: null
    })
    .where(eq(posts.id, id))
    .run();

  revalidatePath('/');
}

export async function deletePost(id: number) {
  await db.delete(posts)
    .where(eq(posts.id, id))
    .run();
  revalidatePath('/');
}
