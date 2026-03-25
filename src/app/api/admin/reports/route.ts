import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const reports = await db.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        comment: {
          select: {
            id: true,
            body: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, status, action } = body;

    if (!reportId || !status) {
      return NextResponse.json({ error: 'Report ID and status are required' }, { status: 400 });
    }

    const report = await db.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    // Take action on the reported content
    if (action === 'hide_post' && report.postId) {
      await db.post.update({
        where: { id: report.postId },
        data: { isHidden: true },
      });
    } else if (action === 'delete_comment' && report.commentId) {
      await db.comment.update({
        where: { id: report.commentId },
        data: { isDeleted: true },
      });
    } else if (action === 'suspend_user' && report.reportedUserId) {
      await db.profile.update({
        where: { id: report.reportedUserId },
        data: { status: 'suspended' },
      });
    } else if (action === 'ban_user' && report.reportedUserId) {
      await db.profile.update({
        where: { id: report.reportedUserId },
        data: { status: 'banned' },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
