"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, MessageCircle } from 'lucide-react'

interface Topic {
  id: number
  name: string
  description?: string
}

interface NewThreadFormProps {
  topics: Topic[]
  selectedTopicId?: number
}

export function NewThreadForm({ topics, selectedTopicId }: NewThreadFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [topicId, setTopicId] = useState(selectedTopicId?.toString() || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/forums/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          topicId: topicId ? parseInt(topicId) : null,
        }),
      })

      if (response.ok) {
        const { thread } = await response.json()
        router.push(`/forums/threads/${thread.id}`)
      } else {
        console.error('Failed to create thread')
      }
    } catch (error) {
      console.error('Error creating thread:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Thread</h1>
          <p className="text-muted-foreground">Start a new discussion</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/forums">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forums
          </Link>
        </Button>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            New Thread
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General Discussion</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id.toString()}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Thread Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for your thread"
                required
                maxLength={128}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here..."
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
              <Button type="submit" disabled={isLoading || !title.trim() || !content.trim() || content.length < 10}>
                {isLoading ? 'Creating...' : 'Create Thread'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/forums">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
