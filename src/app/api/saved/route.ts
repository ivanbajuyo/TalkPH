import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedPosts = await db.savedPost.findMany({
      where: { userId: session.user.id },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
            category: true,
            tags: true,
            media: { where: { moderationStatus: 'approved' } },
            _count: {
              select: { comments: true, reactions: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(savedPosts.map((sp) => sp.post));
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existing) {
      await db.savedPost.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ saved: false });
    }

    await db.savedPost.create({
      data: {
        userId: session.user.id,
        postId,
      },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error('Error toggling saved post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
