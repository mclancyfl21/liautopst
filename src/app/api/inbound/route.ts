import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, users } from '@/db/schema';
import { enforceEmojis } from '@/lib/utils/emoji-enforcement';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const user = await db.select().from(users).where(eq(users.apiToken, token)).get();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content, imageUrl } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const processedContent = enforceEmojis(content);

    const [newPost] = await db.insert(posts).values({
      tenantId: user.tenantId,
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
