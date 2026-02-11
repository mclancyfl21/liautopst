import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { enforceEmojis } from '@/lib/utils/emoji-enforcement';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  // Basic token check - should be replaced with a real credential check from the DB later
  const token = process.env.INBOUND_API_TOKEN || 'secret-token';
  
  if (authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content, imageUrl } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const processedContent = enforceEmojis(content);

    const [newPost] = await db.insert(posts).values({
      content: processedContent,
      imageUrl: imageUrl || null,
      status: 'inventory',
    }).returning();

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error('Inbound API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
