import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const playlists = sqliteTable('playlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  status: text('status').default('inventory').notNull(), // 'inventory', 'queued', 'posted', 'archived'
  playlistId: integer('playlist_id').references(() => playlists.id),
  scheduledFor: integer('scheduled_for', { mode: 'timestamp' }),
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
