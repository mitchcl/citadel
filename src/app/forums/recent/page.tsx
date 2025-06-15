import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, MessageCircle, Calendar } from 'lucide-react'

export default async function RecentPostsPage() {
  const recentPosts = await prisma.forumsPost.findMany({
    take: 20,
    orderBy: { created_at: 'desc' },
    include: {
      created_by: true,
      thread: {
        include: {
          topic: true,
        },
      },
    },
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Recent Posts</h1>
          <p className="text-muted-foreground">Latest activity across all forums</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/forums">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forums
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {recentPosts.map((post) => (
          <Card key={post.id}>
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
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  in{' '}
                  <Link 
                    href={`/forums/threads/${post.thread.id}`}
                    className="hover:underline"
                  >
                    {post.thread.title}
                  </Link>
                  {post.thread.topic && (
                    <>
                      {' '}• {' '}
                      <Link 
                        href={`/forums/topics/${post.thread.topic.id}`}
                        className="hover:underline"
                      >
                        {post.thread.topic.name}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {post.content.length > 300 ? (
                  <>
                    {post.content.substring(0, 300)}...
                    <div className="mt-2">
                      <Button variant="link" size="sm" asChild className="p-0 h-auto">
                        <Link href={`/forums/threads/${post.thread.id}#post-${post.id}`}>
                          Read more
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  post.content.split('\n').map((line, lineIndex) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h4 key={lineIndex} className="font-bold mt-2 mb-1">{line.slice(2, -2)}</h4>
                    }
                    if (line.startsWith('- ')) {
                      return <li key={lineIndex} className="ml-4">{line.slice(2)}</li>
                    }
                    if (line.trim() === '') {
                      return <br key={lineIndex} />
                    }
                    return <p key={lineIndex} className="mb-1">{line}</p>
                  })
                )}
              </div>
              <div className="mt-3 pt-3 border-t">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/forums/threads/${post.thread.id}#post-${post.id}`}>
                    <MessageCircle className="h-3 w-3 mr-2" />
                    View in Thread
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recentPosts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No recent posts found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
