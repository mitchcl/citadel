import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, MessageCircle, Users, Pin } from 'lucide-react'

export default async function ForumsPage() {
  // Get root topics (no parent)
  const topics = await prisma.forumsTopic.findMany({
    where: {
      parent_id: null,
    },
    include: {
      children: {
        include: {
          threads: {
            take: 1,
            orderBy: { updated_at: 'desc' },
            include: {
              created_by: true,
              posts: {
                take: 1,
                orderBy: { created_at: 'desc' },
                include: {
                  created_by: true,
                },
              },
            },
          },
          _count: {
            select: {
              threads: true,
            },
          },
        },
      },
      threads: {
        take: 5,
        orderBy: { updated_at: 'desc' },
        include: {
          created_by: true,
          posts: {
            take: 1,
            orderBy: { created_at: 'desc' },
            include: {
              created_by: true,
            },
          },
        },
      },
      _count: {
        select: {
          threads: true,
        },
      },
    },
    orderBy: [
      { pinned: 'desc' },
      { created_at: 'asc' },
    ],
  })

  // Get recent threads across all topics
  const recentThreads = await prisma.forumsThread.findMany({
    take: 10,
    orderBy: { updated_at: 'desc' },
    include: {
      topic: true,
      created_by: true,
      posts: {
        take: 1,
        orderBy: { created_at: 'desc' },
        include: {
          created_by: true,
        },
      },
    },
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Forums</h1>
          <p className="text-muted-foreground">Community discussion and announcements</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/forums/recent">
              <MessageCircle className="h-4 w-4 mr-2" />
              Recent Posts
            </Link>
          </Button>
          <Button asChild>
            <Link href="/forums/new-thread">
              <Plus className="h-4 w-4 mr-2" />
              New Thread
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {topics.map((topic) => (
          <Card key={topic.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="flex items-center gap-2">
                    {topic.pinned && <Pin className="h-4 w-4 text-blue-500" />}
                    <Link href={`/forums/topics/${topic.id}`} className="hover:underline">
                      {topic.name}
                    </Link>
                  </CardTitle>
                  {topic.locked && <Badge variant="secondary">Locked</Badge>}
                  {topic.hidden && <Badge variant="destructive">Hidden</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {topic._count.threads} threads
                  </div>
                </div>
              </div>
              {topic.description && (
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              )}
            </CardHeader>
            
            {(topic.children.length > 0 || topic.threads.length > 0) && (
              <CardContent>
                {/* Subtopics */}
                {topic.children.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Subtopics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {topic.children.map((subtopic) => (
                        <div key={subtopic.id} className="flex items-center justify-between p-2 rounded border">
                          <Link href={`/forums/topics/${subtopic.id}`} className="font-medium hover:underline">
                            {subtopic.name}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            {subtopic._count.threads} threads
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent threads in this topic */}
                {topic.threads.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recent Threads</h4>
                    <div className="space-y-2">
                      {topic.threads.map((thread) => (
                        <div key={thread.id} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            {thread.pinned && <Pin className="h-3 w-3 text-blue-500" />}
                            <Link href={`/forums/threads/${thread.id}`} className="hover:underline">
                              {thread.title}
                            </Link>
                            {thread.locked && <Badge variant="secondary" className="text-xs">Locked</Badge>}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{thread.posts_count} posts</span>
                            {thread.posts[0] && (
                              <span>by {thread.posts[0].created_by.name}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Recent Activity Sidebar */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentThreads.slice(0, 5).map((thread) => (
              <div key={thread.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Link href={`/forums/threads/${thread.id}`} className="font-medium hover:underline truncate block">
                    {thread.title}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    in {thread.topic?.name || 'General'} • by {thread.created_by.name}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(thread.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
