import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const postType = searchParams.get('postType');
    const sortBy = searchParams.get('sortBy') || 'latest';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    const where: any = {
      isDeleted: false,
      isHidden: false,
    };

    if (category) {
      where.category = { slug: category };
    }

    if (postType) {
      where.postType = postType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { body: { contains: search } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'popular') {
      orderBy = { reactionCount: 'desc' };
    } else if (sortBy === 'discussed') {
      orderBy = { commentCount: 'desc' };
    } else if (sortBy === 'viewed') {
      orderBy = { viewCount: 'desc' };
    }

    const posts = await db.post.findMany({
      where,
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            iconName: true,
          },
        },
        tags: true,
        media: {
          where: { moderationStatus: 'approved' },
        },
        poll: {
          include: {
            options: {
              include: {
                _count: { select: { votes: true } },
              },
            },
          },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    const total = await db.post.count({ where });

    return NextResponse.json({ posts, total });
  } catch (error) {
    console.error('Error fetching posts:', error);
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
    const {
      title,
      body: postBody,
      categoryId,
      postType,
      isAnonymous,
      region,
      province,
      city,
      barangay,
      tags,
      poll,
      media,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const post = await db.post.create({
      data: {
        userId: session.user.id,
        title,
        body: postBody || null,
        categoryId: categoryId || null,
        postType: postType || 'discussion',
        isAnonymous: isAnonymous || false,
        region: region || null,
        province: province || null,
        city: city || null,
        barangay: barangay || null,
        tags: tags
          ? {
              create: tags.map((tag: string) => ({ tag })),
            }
          : undefined,
        poll: poll
          ? {
              create: {
                question: poll.question,
                allowAnonymous: poll.allowAnonymous ?? true,
                endsAt: poll.endsAt ? new Date(poll.endsAt) : null,
                options: {
                  create: poll.options.map((opt: string) => ({
                    optionText: opt,
                  })),
                },
              },
            }
          : undefined,
        media: media && media.length > 0
          ? {
              create: media.map((m: any) => ({
                mediaType: m.mediaType,
                fileUrl: m.fileUrl,
                fileName: m.fileName,
                fileSize: m.fileSize,
                mimeType: m.mimeType,
                uploadedBy: session.user.id,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: true,
        poll: {
          include: { options: true },
        },
        media: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
