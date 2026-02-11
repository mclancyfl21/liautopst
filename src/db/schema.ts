import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const playlists = sqliteTable('playlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const channels = sqliteTable('channels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'playlist', 'random'
  playlistId: integer('playlist_id').references(() => playlists.id),
  scheduleType: text('schedule_type').default('daily'), // 'daily', 'weekly', 'monthly'
  scheduledTime: text('scheduled_time').default('09:00'), // HH:mm
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  status: text('status').default('inventory').notNull(), // 'inventory', 'queued', 'posted', 'archived'
  playlistId: integer('playlist_id').references(() => playlists.id),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  scheduledFor: integer('scheduled_for', { mode: 'timestamp' }), // Legacy field used for queue ordering
  postedAt: integer('posted_at', { mode: 'timestamp' }),
  isRandomModeEligible: integer('is_random_mode_eligible', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const credentials = sqliteTable('credentials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').unique().notNull(), // 'linkedin_client_id', 'openai_api_key', etc.
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
