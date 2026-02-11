'use server';

import { db } from '@/db';
import { playlists, posts } from '@/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import { enforceEmojis } from './utils/emoji-enforcement';
import { revalidatePath } from 'next/cache';

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
  // First, remove association from posts
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
    queue: allPosts.filter(p => p.status === 'queued'),
    posted: allPosts.filter(p => p.status === 'posted'),
  };
}

export async function updatePostStatus(id: number, status: 'inventory' | 'queued' | 'posted' | 'archived') {
  await db.update(posts)
    .set({ status })
    .where(eq(posts.id, id))
    .run();
  revalidatePath('/');
}

export async function updatePost(id: number, content: string, imageUrl?: string | null, playlistId?: number | null) {
  const processedContent = enforceEmojis(content);
  await db.update(posts)
    .set({ 
      content: processedContent,
      imageUrl: imageUrl === undefined ? undefined : imageUrl,
      playlistId: playlistId === undefined ? undefined : playlistId
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
