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

    const { title, content, topicId } = await request.json()

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    if (content.length < 10 || content.length > 10000) {
      return NextResponse.json(
        { error: 'Content must be between 10 and 10000 characters' },
        { status: 400 }
      )
    }

    if (title.length > 128) {
      return NextResponse.json(
        { error: 'Title must be 128 characters or less' },
        { status: 400 }
      )
    }

    // Verify topic exists if provided
    if (topicId) {
      const topic = await prisma.forumsTopic.findUnique({
        where: { id: topicId },
      })

      if (!topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
      }
    }

    // Create thread and first post in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Calculate depth based on topic
      let depth = 0
      if (topicId) {
        const topic = await tx.forumsTopic.findUnique({
          where: { id: topicId },
          select: { depth: true },
        })
        depth = (topic?.depth || 0) + 1
      }

      // Create the thread
      const thread = await tx.forumsThread.create({
        data: {
          title: title.trim(),
          topic_id: topicId || null,
          created_by_id: user.id,
          depth,
          posts_count: 1,
        },
      })

      // Create the first post
      const post = await tx.forumsPost.create({
        data: {
          thread_id: thread.id,
          created_by_id: user.id,
          content: content.trim(),
        },
      })

      return { thread, post }
    })

    return NextResponse.json({ 
      thread: result.thread,
      post: result.post,
    })
  } catch (error) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
}
