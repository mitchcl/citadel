import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { 
  ArrowLeft, 
  Settings, 
  Users, 
  Crown, 
  UserPlus, 
  UserMinus, 
  Trophy,
  AlertTriangle,
  Plus,
  Trash2
} from "lucide-react"

interface TeamSettingsPageProps {
  params: { id: string }
}

export default async function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const teamId = parseInt(id)
  if (isNaN(teamId)) {
    notFound()
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      users: {
        orderBy: { created_at: 'asc' }
      },
      rosters: {
        include: {
          division: {
            include: {
              league: true
            }
          },
          players: {
            include: {
              user: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      },
      _count: {
        select: {
          users: true
        }
      }
    }
  })

  if (!team) {
    notFound()
  }

  // Check if user has permission to manage this team
  const userId = parseInt(session.user.id)
  const isCaptain = team.captain_id === userId
  const isMember = team.users.some(user => user.id === userId)
  const isAdmin = session.user.admin

  if (!isCaptain && !isAdmin) {
    redirect(`/teams/${team.id}`)
  }

  const activeRosters = team.rosters.filter(roster => 
    roster.division.league.status === 1 || roster.division.league.status === 0
  )
  const pastRosters = team.rosters.filter(roster => 
    roster.division.league.status === 2
  )

  return (
    <div className="container max-w-6xl py-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={`/teams/${team.id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Team
        </Link>
      </Button>

      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Team Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members ({team._count.users})</TabsTrigger>
          <TabsTrigger value="rosters">Rosters ({team.rosters.length})</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Team Information */}
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>
                Update your team's basic information and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={team.avatar || ""} alt={team.name} />
                  <AvatarFallback className="text-lg">{team.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{team.name}</h3>
                  <p className="text-sm text-muted-foreground">Team Avatar</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Change Avatar
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    defaultValue={team.name}
                    placeholder="Your team name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea
                    id="team-description"
                    defaultValue={team.description || ""}
                    placeholder="Describe your team..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="team-tag">Team Tag</Label>
                  <Input
                    id="team-tag"
                    defaultValue={team.tag || ""}
                    placeholder="e.g., [TAG]"
                    maxLength={8}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage your team's members and permissions.
                  </CardDescription>
                </div>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Player
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar || ""} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Member since {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.id === team.captain_id && (
                        <Badge variant="default">
                          <Crown className="h-3 w-3 mr-1" />
                          Captain
                        </Badge>
                      )}
                      {user.id === userId && (
                        <Badge variant="outline">You</Badge>
                      )}
                      {isCaptain && user.id !== team.captain_id && user.id !== userId && (
                        <Button variant="outline" size="sm">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rosters" className="space-y-6">
          {/* Active Rosters */}
          {activeRosters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active League Registrations</CardTitle>
                <CardDescription>
                  Your team's current league participations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeRosters.map((roster) => (
                    <div key={roster.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{roster.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {roster.division.league.name} • {roster.players.length} players
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={roster.approved ? 'default' : 'secondary'}
                        >
                          {roster.approved ? 'Approved' : 'Pending'}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/leagues/${roster.division.league.id}`}>
                            View League
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Rosters */}
          {pastRosters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>League History</CardTitle>
                <CardDescription>
                  Your team's past league participations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastRosters.map((roster) => (
                    <div key={roster.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{roster.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {roster.division.league.name} • Final Points: {roster.points}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Completed</Badge>
                        {roster.placement !== null && (
                          <Badge variant="secondary">
                            #{roster.placement + 1}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Rosters */}
          {team.rosters.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No league participations</h3>
                <p className="text-muted-foreground text-center mb-4">
                  This team hasn't registered for any leagues yet.
                </p>
                <Link href="/leagues">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Leagues
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                <div>
                  <h4 className="font-medium">Transfer Captain Role</h4>
                  <p className="text-sm text-muted-foreground">
                    Transfer team leadership to another member
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Transfer
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                <div>
                  <h4 className="font-medium">Leave Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Remove yourself from this team
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Leave Team
                </Button>
              </div>

              {isCaptain && (
                <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                  <div>
                    <h4 className="font-medium text-destructive">Delete Team</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this team and all associated data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Team
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
