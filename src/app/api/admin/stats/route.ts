import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalReports,
      openReports,
      totalMedia,
    ] = await Promise.all([
      db.profile.count(),
      db.profile.count({ where: { status: 'active' } }),
      db.post.count({ where: { isDeleted: false } }),
      db.comment.count({ where: { isDeleted: false } }),
      db.report.count(),
      db.report.count({ where: { status: 'open' } }),
      db.postMedia.count({ where: { moderationStatus: 'approved' } }),
    ]);

    // Most active categories
    const mostActiveCategories = await db.category.findMany({
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: { posts: { _count: 'desc' } },
      take: 5,
    });

    // Most active regions
    const mostActiveRegions = await db.post.groupBy({
      by: ['region'],
      _count: { id: true },
      where: { region: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalReports,
      openReports,
      totalMedia,
      mostActiveCategories: mostActiveCategories.map((c) => ({
        name: c.name,
        count: c._count.posts,
      })),
      mostActiveRegions: mostActiveRegions.map((r) => ({
        region: r.region,
        count: r._count.id,
      })),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
