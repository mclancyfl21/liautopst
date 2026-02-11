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
  // Main Automation Loop - Runs every hour to check for precision schedules and channel streams
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    
    // 1. CRITICAL: Check for any posts with a specific scheduledAt time that has passed
    const timeScheduledPosts = await db.select()
      .from(posts)
      .where(and(
        eq(posts.status, 'inventory'),
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
        // Sequential Playlist Mode: Pick the oldest unposted post in the playlist
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
        // Random Mode: Pick any eligible inventory item
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
}
