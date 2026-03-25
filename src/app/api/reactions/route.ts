import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, commentId, reactionType } = body;

    if (!reactionType) {
      return NextResponse.json(
        { error: 'Reaction type is required' },
        { status: 400 }
      );
    }

    if (!postId && !commentId) {
      return NextResponse.json(
        { error: 'Post ID or Comment ID is required' },
        { status: 400 }
      );
    }

    // Check if reaction already exists
    const existing = await db.reaction.findFirst({
      where: {
        userId: session.user.id,
        postId: postId || null,
        commentId: commentId || null,
      },
    });

    if (existing) {
      // Update existing reaction
      const reaction = await db.reaction.update({
        where: { id: existing.id },
        data: { reactionType },
      });

      return NextResponse.json(reaction);
    }

    // Create new reaction
    const reaction = await db.reaction.create({
      data: {
        userId: session.user.id,
        postId: postId || null,
        commentId: commentId || null,
        reactionType,
      },
    });

    // Update reaction count
    if (postId) {
      await db.post.update({
        where: { id: postId },
        data: { reactionCount: { increment: 1 } },
      });
    }
    if (commentId) {
      await db.comment.update({
        where: { id: commentId },
        data: { reactionCount: { increment: 1 } },
      });
    }

    return NextResponse.json(reaction);
  } catch (error) {
    console.error('Error creating reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    const commentId = searchParams.get('commentId');

    const existing = await db.reaction.findFirst({
      where: {
        userId: session.user.id,
        postId: postId || null,
        commentId: commentId || null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
    }

    await db.reaction.delete({
      where: { id: existing.id },
    });

    // Update reaction count
    if (postId) {
      await db.post.update({
        where: { id: postId },
        data: { reactionCount: { decrement: 1 } },
      });
    }
    if (commentId) {
      await db.comment.update({
        where: { id: commentId },
        data: { reactionCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
