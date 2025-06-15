import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, MessageCircle, Pin, Lock, EyeOff, User, Calendar, Hash } from 'lucide-react'

interface ThreadPageProps {
  params: Promise<{ id: string }>
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { id } = await params
  
  const thread = await prisma.forumsThread.findUnique({
    where: { id: parseInt(id) },
    include: {
      topic: {
        include: {
          parent: true,
        },
      },
      created_by: true,
      posts: {
        include: {
          created_by: true,
          edits: {
            include: {
              created_by: true,
            },
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        orderBy: { created_at: 'asc' },
      },
    },
  })

  if (!thread) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/forums" className="text-muted-foreground hover:text-foreground">
          Forums
        </Link>
        {thread.topic && (
          <>
            {thread.topic.parent && (
              <>
                <span className="text-muted-foreground">/</span>
                <Link 
                  href={`/forums/topics/${thread.topic.parent.id}`} 
                  className="text-muted-foreground hover:text-foreground"
                >
                  {thread.topic.parent.name}
                </Link>
              </>
            )}
            <span className="text-muted-foreground">/</span>
            <Link 
              href={`/forums/topics/${thread.topic.id}`} 
              className="text-muted-foreground hover:text-foreground"
            >
              {thread.topic.name}
            </Link>
          </>
        )}
        <span className="text-muted-foreground">/</span>
        <span className="font-medium truncate">{thread.title}</span>
      </div>

      {/* Thread Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold flex items-center gap-2 truncate">
              {thread.pinned && <Pin className="h-6 w-6 text-blue-500 flex-shrink-0" />}
              {thread.title}
            </h1>
            <div className="flex gap-2 flex-shrink-0">
              {thread.locked && <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
              {thread.hidden && <Badge variant="destructive"><EyeOff className="h-3 w-3 mr-1" />Hidden</Badge>}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {thread.posts_count} posts
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Started by {thread.created_by.name}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(thread.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button asChild variant="outline">
            <Link href={thread.topic ? `/forums/topics/${thread.topic.id}` : '/forums'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          {!thread.locked && (
            <Button asChild>
              <Link href={`/forums/threads/${thread.id}/reply`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Reply
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {thread.posts.map((post, index) => (
          <Card key={post.id} id={`post-${post.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {post.created_by.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{post.created_by.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    {index + 1}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/forums/threads/${thread.id}#post-${post.id}`}>
                      #
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {post.content.split('\n').map((line, lineIndex) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <h4 key={lineIndex} className="font-bold mt-4 mb-2">{line.slice(2, -2)}</h4>
                  }
                  if (line.startsWith('- ')) {
                    return <li key={lineIndex} className="ml-4">{line.slice(2)}</li>
                  }
                  if (line.trim() === '') {
                    return <br key={lineIndex} />
                  }
                  return <p key={lineIndex} className="mb-2">{line}</p>
                })}
              </div>
              
              {post.edits.length > 0 && (
                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Last edited by {post.edits[0].created_by.name} on {new Date(post.edits[0].created_at).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reply prompt for non-locked threads */}
      {!thread.locked && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Want to join the discussion?</p>
              <Button asChild>
                <Link href={`/forums/threads/${thread.id}/reply`}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Post a Reply
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
