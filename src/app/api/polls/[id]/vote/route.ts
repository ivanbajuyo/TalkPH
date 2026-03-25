import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/polls/[id]/vote - Vote on a poll
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

    const body = await request.json()
    const { optionId } = body

    if (!optionId) {
      return NextResponse.json(
        { error: 'optionId is required' },
        { status: 400 }
      )
    }

    // Check if poll exists
    const poll = await db.poll.findUnique({
      where: { id },
      include: {
        options: { select: { id: true } }
      }
    })

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if option belongs to poll
    const optionBelongsToPoll = poll.options.some(o => o.id === optionId)
    if (!optionBelongsToPoll) {
      return NextResponse.json(
        { error: 'Invalid option' },
        { status: 400 }
      )
    }

    // Check if user already voted
    const existingVote = await db.pollVote.findUnique({
      where: {
        pollId_userId: {
          pollId: id,
          userId: session.user.id
        }
      }
    })

    if (existingVote) {
      return NextResponse.json(
        { error: 'Already voted' },
        { status: 400 }
      )
    }

    // Create vote
    await db.pollVote.create({
      data: {
        pollId: id,
        optionId,
        userId: session.user.id,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error voting on poll:', error)
    return NextResponse.json(
      { error: 'Failed to vote on poll' },
      { status: 500 }
    )
  }
}
