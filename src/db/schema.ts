import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const tenants = sqliteTable('tenants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(), // Hashed
  role: text('role').default('admin').notNull(), // 'admin', 'superadmin'
  apiToken: text('api_token').unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const playlists = sqliteTable('playlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const channels = sqliteTable('channels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'playlist', 'random'
  playlistId: integer('playlist_id').references(() => playlists.id),
  scheduleType: text('schedule_type').default('daily').notNull(), // 'daily', 'weekly', 'monthly'
  scheduledTime: text('scheduled_time').default('09:00').notNull(), // HH:mm
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  status: text('status').default('inventory').notNull(), // 'inventory', 'posted', 'archived'
  playlistId: integer('playlist_id').references(() => playlists.id),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  scheduledFor: integer('scheduled_for', { mode: 'timestamp' }), // Legacy
  postedAt: integer('posted_at', { mode: 'timestamp' }),
  isScheduleActive: integer('is_schedule_active', { mode: 'boolean' }).default(true),
  isRandomModeEligible: integer('is_random_mode_eligible', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const credentials = sqliteTable('credentials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  key: text('key').notNull(), // Removed unique constraint to allow per-user keys
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const aiProviders = sqliteTable('ai_providers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  endpoint: text('endpoint').notNull(),
  apiKey: text('api_key'),
  model: text('model').notNull(),
  systemPrompt: text('system_prompt'),
  userPrompt: text('user_prompt'),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
