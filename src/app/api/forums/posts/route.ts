import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user from the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { content, threadId } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (content.length < 10 || content.length > 10000) {
      return NextResponse.json(
        { error: 'Content must be between 10 and 10000 characters' },
        { status: 400 }
      )
    }

    // Verify thread exists and is not locked
    const thread = await prisma.forumsThread.findUnique({
      where: { id: threadId },
      select: { id: true, locked: true },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    if (thread.locked) {
      return NextResponse.json({ error: 'Thread is locked' }, { status: 403 })
    }

    // Create post and update thread post count in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the post
      const post = await tx.forumsPost.create({
        data: {
          thread_id: threadId,
          created_by_id: user.id,
          content: content.trim(),
        },
      })

      // Update thread post count
      await tx.forumsThread.update({
        where: { id: threadId },
        data: {
          posts_count: {
            increment: 1,
          },
          updated_at: new Date(),
        },
      })

      return post
    })

    return NextResponse.json({ post: result })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
