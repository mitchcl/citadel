"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, MessageCircle } from 'lucide-react'

interface Thread {
  id: number
  title: string
  topic?: {
    id: number
    name: string
  }
}

interface ReplyFormProps {
  thread: Thread
}

export function ReplyForm({ thread }: ReplyFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/forums/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          threadId: thread.id,
        }),
      })

      if (response.ok) {
        const { post } = await response.json()
        router.push(`/forums/threads/${thread.id}#post-${post.id}`)
      } else {
        console.error('Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setIsLoading(false)
    }
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
        <Link 
          href={`/forums/threads/${thread.id}`} 
          className="text-muted-foreground hover:text-foreground truncate"
        >
          {thread.title}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">Reply</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Post a Reply</h1>
          <p className="text-muted-foreground">Replying to: {thread.title}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/forums/threads/${thread.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Thread
          </Link>
        </Button>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Your Reply
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your reply here..."
                rows={12}
                required
                minLength={10}
                maxLength={10000}
              />
              <div className="text-sm text-muted-foreground">
                {content.length}/10000 characters (minimum 10)
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading || !content.trim() || content.length < 10}>
                {isLoading ? 'Posting...' : 'Post Reply'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/forums/threads/${thread.id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
