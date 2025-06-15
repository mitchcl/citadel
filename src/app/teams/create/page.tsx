"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"

const teamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(64, "Team name must be 64 characters or less"),
  tag: z.string().max(8, "Team tag must be 8 characters or less").optional(),
  description: z.string().max(1000, "Description must be 1000 characters or less").optional(),
  notice: z.string().max(1000, "Notice must be 1000 characters or less").optional(),
})

type TeamFormData = z.infer<typeof teamSchema>

export default function CreateTeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
  })

  // Redirect if not authenticated
  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    router.push("/api/auth/signin")
    return null
  }

  const onSubmit = async (data: TeamFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create team")
      }

      const team = await response.json()
      router.push(`/teams/${team.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const descriptionLength = watch("description")?.length || 0
  const noticeLength = watch("notice")?.length || 0

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/teams">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Teams
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Users className="w-8 h-8 mr-3" />
            Create New Team
          </h1>
          <p className="text-muted-foreground mt-2">
            Start your competitive journey by creating a team
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              Fill in the details for your new team. You can always edit these later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter team name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tag">Team Tag</Label>
                <Input
                  id="tag"
                  {...register("tag")}
                  placeholder="Optional team tag (e.g., TF2)"
                  maxLength={8}
                  className={errors.tag ? "border-red-500" : ""}
                />
                {errors.tag && (
                  <p className="text-sm text-red-500">{errors.tag.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  A short identifier for your team (max 8 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Tell others about your team..."
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                />
                <div className="flex justify-between">
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground ml-auto">
                    {descriptionLength}/1000 characters
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notice">Team Notice</Label>
                <Textarea
                  id="notice"
                  {...register("notice")}
                  placeholder="Any announcements or notices for team members..."
                  rows={3}
                  className={errors.notice ? "border-red-500" : ""}
                />
                <div className="flex justify-between">
                  {errors.notice && (
                    <p className="text-sm text-red-500">{errors.notice.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground ml-auto">
                    {noticeLength}/1000 characters
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Creating..." : "Create Team"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/teams">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Next Steps</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• After creating your team, you can invite players to join</li>
            <li>• Upload a team avatar to represent your team</li>
            <li>• Register for leagues and competitions</li>
            <li>• Manage team rosters and transfers</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
