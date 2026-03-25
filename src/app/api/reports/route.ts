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
    const { reportedUserId, postId, commentId, postMediaId, commentMediaId, reason, details } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    const report = await db.report.create({
      data: {
        reporterId: session.user.id,
        reportedUserId: reportedUserId || null,
        postId: postId || null,
        commentId: commentId || null,
        postMediaId: postMediaId || null,
        commentMediaId: commentMediaId || null,
        reason,
        details: details || null,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
