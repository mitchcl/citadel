import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, MessageCircle, Pin, Lock, Eye, EyeOff } from 'lucide-react'

interface TopicPageProps {
  params: Promise<{ id: string }>
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { id } = await params
  
  const topic = await prisma.forumsTopic.findUnique({
    where: { id: parseInt(id) },
    include: {
      parent: true,
      children: {
        include: {
          _count: {
            select: {
              threads: true,
            },
          },
        },
        orderBy: [
          { pinned: 'desc' },
          { name: 'asc' },
        ],
      },
      threads: {
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
        orderBy: [
          { pinned: 'desc' },
          { updated_at: 'desc' },
        ],
      },
      created_by: true,
      _count: {
        select: {
          threads: true,
        },
      },
    },
  })

  if (!topic) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/forums" className="text-muted-foreground hover:text-foreground">
          Forums
        </Link>
        {topic.parent && (
          <>
            <span className="text-muted-foreground">/</span>
            <Link 
              href={`/forums/topics/${topic.parent.id}`} 
              className="text-muted-foreground hover:text-foreground"
            >
              {topic.parent.name}
            </Link>
          </>
        )}
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{topic.name}</span>
      </div>

      {/* Topic Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {topic.pinned && <Pin className="h-6 w-6 text-blue-500" />}
              {topic.name}
            </h1>
            <div className="flex gap-2">
              {topic.locked && <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
              {topic.hidden && <Badge variant="destructive"><EyeOff className="h-3 w-3 mr-1" />Hidden</Badge>}
            </div>
          </div>
          
          {topic.description && (
            <p className="text-muted-foreground mb-4">{topic.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {topic._count.threads} threads
            </div>
            <span>Created by {topic.created_by.name}</span>
            <span>{new Date(topic.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/forums">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forums
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/forums/topics/${topic.id}/new-thread`}>
              <Plus className="h-4 w-4 mr-2" />
              New Thread
            </Link>
          </Button>
        </div>
      </div>

      {/* Subtopics */}
      {topic.children.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Subtopics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topic.children.map((subtopic) => (
                <div key={subtopic.id} className="flex items-center justify-between p-4 rounded border">
                  <div>
                    <Link href={`/forums/topics/${subtopic.id}`} className="font-medium hover:underline">
                      {subtopic.name}
                    </Link>
                    {subtopic.description && (
                      <p className="text-sm text-muted-foreground mt-1">{subtopic.description}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {subtopic._count.threads} threads
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Threads */}
      <Card>
        <CardHeader>
          <CardTitle>Threads</CardTitle>
        </CardHeader>
        <CardContent>
          {topic.threads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No threads in this topic yet.</p>
              <Button asChild className="mt-4">
                <Link href={`/forums/topics/${topic.id}/new-thread`}>
                  Create the first thread
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {topic.threads.map((thread) => (
                <div key={thread.id} className="flex items-center justify-between p-4 rounded border hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {thread.pinned && <Pin className="h-4 w-4 text-blue-500" />}
                      <Link href={`/forums/threads/${thread.id}`} className="font-medium hover:underline">
                        {thread.title}
                      </Link>
                      <div className="flex gap-1">
                        {thread.locked && <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
                        {thread.hidden && <Badge variant="destructive" className="text-xs"><EyeOff className="h-3 w-3 mr-1" />Hidden</Badge>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Started by {thread.created_by.name} • {new Date(thread.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{thread.posts_count}</div>
                      <div className="text-muted-foreground">posts</div>
                    </div>
                    
                    {thread.posts[0] && (
                      <div className="text-right min-w-0">
                        <div className="font-medium truncate">
                          {thread.posts[0].created_by.name}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(thread.posts[0].created_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
