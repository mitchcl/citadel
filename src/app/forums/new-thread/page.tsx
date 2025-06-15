import { prisma } from '@/lib/prisma'
import { NewThreadForm } from './new-thread-form'

export default async function NewThreadPage() {
  // Get available topics for the dropdown
  const topics = await prisma.forumsTopic.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: { name: 'asc' },
  })

  return <NewThreadForm topics={topics} />
}
