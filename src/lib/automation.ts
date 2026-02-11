import cron from 'node-cron';
import { db } from '@/db';
import { posts, channels, credentials } from '@/db/schema';
import { eq, and, isNull, asc, lte, or } from 'drizzle-orm';

async function postToLinkedIn(post: any) {
  console.log(`[AUTOMATION] Posting to LinkedIn: ${post.content.substring(0, 50)}...`);
  // In a real implementation, this would use LinkedIn API with stored credentials
  return true;
}

async function markAsPosted(postId: number) {
  await db.update(posts)
    .set({ 
      status: 'posted', 
      postedAt: new Date(),
      playlistId: null,
      scheduledAt: null
    })
    .where(eq(posts.id, postId))
    .run();
}

export function initCronJobs() {
  // Main Automation Loop - Runs every hour to check for scheduled distributions
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    
    // 1. CRITICAL: Check for any posts (Queue or Inventory) with a specific scheduledAt time that has passed
    const timeScheduledPosts = await db.select()
      .from(posts)
      .where(and(
        eq(posts.status, 'inventory'), // We also check inventory for precision scheduling
        lte(posts.scheduledAt, now)
      ))
      .all();

    for (const post of timeScheduledPosts) {
      console.log(`[CRON] Processing precision scheduled post: ${post.id}`);
      const success = await postToLinkedIn(post);
      if (success) await markAsPosted(post.id);
    }

    // 2. Process Active Channels (Playlist/Random)
    const activeChannels = await db.select().from(channels).where(eq(channels.isActive, true)).all();
    
    for (const channel of activeChannels) {
      console.log(`[CRON] Processing Channel: ${channel.name} (${channel.type})`);
      
      if (channel.type === 'playlist' && channel.playlistId) {
        const nextInPlaylist = await db.select()
          .from(posts)
          .where(and(
            eq(posts.playlistId, channel.playlistId),
            eq(posts.status, 'inventory'),
            isNull(posts.scheduledAt) // Don't steal precision scheduled posts
          ))
          .orderBy(asc(posts.createdAt))
          .limit(1)
          .get();

        if (nextInPlaylist) {
          const success = await postToLinkedIn(nextInPlaylist);
          if (success) await markAsPosted(nextInPlaylist.id);
        }
      } 
      
      else if (channel.type === 'random') {
        const eligiblePosts = await db.select()
          .from(posts)
          .where(and(
            eq(posts.status, 'inventory'),
            eq(posts.isRandomModeEligible, true),
            isNull(posts.scheduledAt)
          ))
          .all();

        if (eligiblePosts.length > 0) {
          const randomPost = eligiblePosts[Math.floor(Math.random() * eligiblePosts.length)];
          const success = await postToLinkedIn(randomPost);
          if (success) await markAsPosted(randomPost.id);
        }
      }
    }
  });

  // Dedicated Daily Queue Runner (Daily at 10 AM)
  cron.schedule('0 10 * * *', async () => {
    const now = new Date();
    console.log('[CRON] Checking Daily Queue...');
    
    // First, check if there's a post in the queue with a precision schedule for RIGHT NOW (handled by hourly, but for safety)
    // Then fallback to the sequential queue order
    
    const nextInQueue = await db.select()
      .from(posts)
      .where(eq(posts.status, 'queued'))
      .orderBy(asc(posts.scheduledAt), asc(posts.createdAt)) // Precision schedule first, then order
      .limit(1)
      .get();
      
    if (nextInQueue) {
      // If it has a precision schedule in the future, don't post it yet as part of the daily batch
      if (nextInQueue.scheduledAt && nextInQueue.scheduledAt > now) {
         console.log(`[CRON] Next item in queue ${nextInQueue.id} has a future precision schedule, skipping daily batch.`);
         return;
      }

      const success = await postToLinkedIn(nextInQueue);
      if (success) await markAsPosted(nextInQueue.id);
    }
  });
}
