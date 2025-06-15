import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ReplyForm } from './reply-form'

interface ReplyPageProps {
  params: Promise<{ id: string }>
}

export default async function ReplyPage({ params }: ReplyPageProps) {
  const { id } = await params
  
  const thread = await prisma.forumsThread.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      title: true,
      locked: true,
      topic: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!thread) {
    notFound()
  }

  if (thread.locked) {
    notFound() // Or redirect with a message
  }

  return <ReplyForm thread={thread} />
}
