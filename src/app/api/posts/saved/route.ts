import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/posts/saved - Get saved posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    const savedPosts = await db.savedPost.findMany({
      where: { userId: session.user.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            },
            media: {
              select: {
                id: true,
                mediaType: true,
                fileUrl: true,
              },
              take: 1,
            },
            reactions: {
              select: {
                reactionType: true,
              }
            },
            _count: {
              select: {
                comments: true,
                reactions: true,
              }
            }
          }
        }
      }
    })

    const posts = savedPosts.map(sp => {
      const post = sp.post
      
      // Aggregate reactions
      const reactionCounts: Record<string, number> = {}
      post.reactions.forEach(r => {
        reactionCounts[r.reactionType] = (reactionCounts[r.reactionType] || 0) + 1
      })

      return {
        ...post,
        commentCount: post._count.comments,
        reactionCount: post._count.reactions,
        reactions: Object.entries(reactionCounts).map(([type, count]) => ({
          reactionType: type,
          _count: count
        })),
        userReaction: null,
        isSaved: true,
        _count: undefined,
      }
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching saved posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved posts' },
      { status: 500 }
    )
  }
}
