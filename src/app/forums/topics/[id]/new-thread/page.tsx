import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { NewThreadForm } from '../../new-thread/new-thread-form'

interface TopicNewThreadPageProps {
  params: Promise<{ id: string }>
}

export default async function TopicNewThreadPage({ params }: TopicNewThreadPageProps) {
  const { id } = await params
  
  const topic = await prisma.forumsTopic.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      name: true,
      locked: true,
    },
  })

  if (!topic) {
    notFound()
  }

  if (topic.locked) {
    notFound() // Or redirect with a message
  }

  // Get all topics for the dropdown
  const allTopics = await prisma.forumsTopic.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: { name: 'asc' },
  })

  return <NewThreadForm topics={allTopics} selectedTopicId={topic.id} />
}
