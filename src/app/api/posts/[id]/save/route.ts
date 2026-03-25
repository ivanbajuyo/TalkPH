import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/posts/[id]/save - Toggle save post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if already saved
    const existing = await db.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: id
        }
      }
    })

    if (existing) {
      // Unsave
      await db.savedPost.delete({
        where: { id: existing.id }
      })
      return NextResponse.json({ saved: false })
    } else {
      // Save
      await db.savedPost.create({
        data: {
          userId: session.user.id,
          postId: id
        }
      })
      return NextResponse.json({ saved: true })
    }
  } catch (error) {
    console.error('Error toggling save:', error)
    return NextResponse.json(
      { error: 'Failed to toggle save' },
      { status: 500 }
    )
  }
}
