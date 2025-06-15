"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle } from "lucide-react"

interface RegistrationFormProps {
  league: {
    id: number
    name: string
    min_players: number
    max_players: number
    divisions: Array<{
      id: number
      name: string
    }>
  }
  team: {
    id: number
    name: string
    users: Array<{
      id: number
      name: string
    }>
  }
  userId: number
}

export function RegistrationForm({ league, team, userId }: RegistrationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    roster_name: team.name,
    division_id: league.divisions[0]?.id || "",
    description: "",
    selected_players: team.users.map(user => user.id),
    accept_rules: false,
  })

  const handlePlayerToggle = (playerId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selected_players: checked 
        ? [...prev.selected_players, playerId]
        : prev.selected_players.filter(id => id !== playerId)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!formData.accept_rules) {
      setError("You must accept the league rules to register")
      setIsSubmitting(false)
      return
    }

    if (formData.selected_players.length < league.min_players) {
      setError(`You must select at least ${league.min_players} players`)
      setIsSubmitting(false)
      return
    }

    if (league.max_players > 0 && formData.selected_players.length > league.max_players) {
      setError(`You can select at most ${league.max_players} players`)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(`/api/leagues/${league.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: team.id,
          roster_name: formData.roster_name,
          division_id: parseInt(formData.division_id.toString()),
          description: formData.description,
          selected_players: formData.selected_players,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      const result = await response.json()
      router.push(`/teams/${team.id}?registered=true`)
    } catch (error) {
      console.error('Registration error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Registration Details</CardTitle>
          <CardDescription>
            Configure your team's registration for this league.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="roster_name">Roster Name</Label>
              <Input
                id="roster_name"
                value={formData.roster_name}
                onChange={(e) => setFormData(prev => ({ ...prev, roster_name: e.target.value }))}
                placeholder="Enter roster name"
                required
              />
              <p className="text-sm text-muted-foreground">
                This is how your team will appear in the league standings
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="division">Division</Label>
              <Select
                value={formData.division_id.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, division_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a division" />
                </SelectTrigger>
                <SelectContent>
                  {league.divisions.map((division) => (
                    <SelectItem key={division.id} value={division.id.toString()}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Team Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your team, strategy, or goals for this league..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Players</CardTitle>
          <CardDescription>
            Choose which team members will participate in this league roster.
            You need between {league.min_players} and {league.max_players > 0 ? league.max_players : 'unlimited'} players.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.users.map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`player-${user.id}`}
                  checked={formData.selected_players.includes(user.id)}
                  onCheckedChange={(checked) => handlePlayerToggle(user.id, checked as boolean)}
                />
                <Label 
                  htmlFor={`player-${user.id}`}
                  className="flex-1 cursor-pointer"
                >
                  {user.name}
                </Label>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Selected: {formData.selected_players.length} / {league.max_players > 0 ? league.max_players : '∞'} players
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>League Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>By registering for this league, you agree to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Follow all league rules and regulations</li>
                <li>Participate in scheduled matches</li>
                <li>Maintain good sportsmanship</li>
                <li>Keep your roster information up to date</li>
                <li>Accept admin decisions regarding disputes</li>
              </ul>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="accept_rules"
                checked={formData.accept_rules}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accept_rules: checked as boolean }))}
                required
              />
              <Label htmlFor="accept_rules" className="cursor-pointer">
                I accept the league rules and regulations
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.accept_rules}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Registering...' : 'Register Team'}
        </Button>
      </div>
    </form>
  )
}
