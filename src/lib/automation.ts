import cron from 'node-cron';
import { db } from '@/db';
import { posts, credentials } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// This is a simplified mock of the LinkedIn posting logic
// In a real app, this would use the LinkedIn API credentials from the DB
async function postToLinkedIn(post: any) {
  console.log(`[AUTOMATION] Posting to LinkedIn: ${post.content.substring(0, 50)}...`);
  // LinkedIn API logic here...
  return true;
}

export function initCronJobs() {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Checking for Random Mode distribution...');
    
    // Check if Random Mode is active (stored as a credential/setting)
    const randomModeSetting = await db.select()
      .from(credentials)
      .where(eq(credentials.key, 'random_mode_active'))
      .get();
      
    if (randomModeSetting?.value === 'true') {
      // Pick a random unposted item eligible for random mode
      const eligiblePosts = await db.select()
        .from(posts)
        .where(and(
          eq(posts.status, 'inventory'),
          eq(posts.isRandomModeEligible, true)
        ))
        .all();
        
      if (eligiblePosts.length > 0) {
        const randomPost = eligiblePosts[Math.floor(Math.random() * eligiblePosts.length)];
        
        const success = await postToLinkedIn(randomPost);
        
        if (success) {
          await db.update(posts)
            .set({ status: 'posted', postedAt: new Date() })
            .where(eq(posts.id, randomPost.id))
            .run();
          console.log(`[CRON] Successfully posted random item: ${randomPost.id}`);
        }
      }
    }
  });

  // Run every day at 10:00 AM for the 7-Day Queue
  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Checking 7-Day Queue...');
    
    // Get the first item in the queue (ordered by scheduled date or ID)
    const nextInQueue = await db.select()
      .from(posts)
      .where(eq(posts.status, 'queued'))
      .orderBy(posts.scheduledFor)
      .limit(1)
      .get();
      
    if (nextInQueue) {
      const success = await postToLinkedIn(nextInQueue);
      if (success) {
        await db.update(posts)
          .set({ status: 'posted', postedAt: new Date() })
          .where(eq(posts.id, nextInQueue.id))
          .run();
      }
    }
  });
}
