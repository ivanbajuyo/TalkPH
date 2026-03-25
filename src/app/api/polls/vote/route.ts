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
    const { pollId, optionId } = body;

    if (!pollId || !optionId) {
      return NextResponse.json(
        { error: 'Poll ID and Option ID are required' },
        { status: 400 }
      );
    }

    // Check if already voted
    const existingVote = await db.pollVote.findUnique({
      where: {
        pollId_userId: {
          pollId,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'Already voted in this poll' },
        { status: 400 }
      );
    }

    const vote = await db.pollVote.create({
      data: {
        pollId,
        optionId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(vote);
  } catch (error) {
    console.error('Error voting in poll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
