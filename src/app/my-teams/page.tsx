import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Users, Trophy, Calendar, Plus, Settings } from "lucide-react"

export default async function MyTeamsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  // Get user's teams and rosters
  const userWithTeams = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    include: {
      teams: {
        include: {
          rosters: {
            include: {
              league: true,
              _count: {
                select: {
                  players: true
                }
              }
            }
          },
          _count: {
            select: {
              users: true
            }
          }
        }
      },
      rosters: {
        include: {
          team: true,
          league: true,
          _count: {
            select: {
              players: true
            }
          }
        }
      }
    }
  })

  const teams = userWithTeams?.teams || []
  const rosters = userWithTeams?.rosters || []

  // Separate active and past rosters
  const activeRosters = rosters.filter(roster => 
    roster.league.status === 'running' || roster.league.status === 'signuppable'
  )
  const pastRosters = rosters.filter(roster => 
    roster.league.status === 'completed'
  )

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">My Teams</h1>
        </div>
        <Link href="/teams/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="teams">My Teams ({teams.length})</TabsTrigger>
          <TabsTrigger value="active">Active Rosters ({activeRosters.length})</TabsTrigger>
          <TabsTrigger value="past">Past Rosters ({pastRosters.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          {teams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first team to start competing in leagues and tournaments.
                </p>
                <Link href="/teams/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Team
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={team.avatar || ""} alt={team.name} />
                          <AvatarFallback>{team.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl">
                            <Link href={`/teams/${team.id}`} className="hover:text-primary">
                              {team.name}
                            </Link>
                          </CardTitle>
                          <CardDescription>
                            {team._count.users} member{team._count.users !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {team.rosters.length > 0 && (
                          <Badge variant="secondary">
                            {team.rosters.length} roster{team.rosters.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        <Link href={`/teams/${team.id}/settings`}>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  {team.description && (
                    <CardContent>
                      <p className="text-muted-foreground">{team.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeRosters.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active rosters</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You're not currently registered for any active leagues.
                </p>
                <Link href="/leagues">
                  <Button>
                    <Trophy className="h-4 w-4 mr-2" />
                    Browse Leagues
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeRosters.map((roster) => (
                <Card key={roster.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          <Link href={`/teams/${roster.team.id}`} className="hover:text-primary">
                            {roster.name}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          <Link href={`/leagues/${roster.league.id}`} className="hover:text-primary">
                            {roster.league.name}
                          </Link>
                          {' • '}
                          {roster._count.players} player{roster._count.players !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={roster.league.status === 'running' ? 'default' : 'secondary'}
                        >
                          {roster.league.status === 'running' ? 'Active' : 'Signups'}
                        </Badge>
                        {roster.approved && (
                          <Badge variant="outline" className="text-green-600">
                            Approved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        League Points: {roster.points || 0}
                      </div>
                      {roster.wonRounds && (
                        <div className="flex items-center gap-1">
                          Wins: {roster.wonRounds}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastRosters.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No past competitions</h3>
                <p className="text-muted-foreground text-center">
                  Your completed league participations will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastRosters.map((roster) => (
                <Card key={roster.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          <Link href={`/teams/${roster.team.id}`} className="hover:text-primary">
                            {roster.name}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          <Link href={`/leagues/${roster.league.id}`} className="hover:text-primary">
                            {roster.league.name}
                          </Link>
                          {' • '}
                          Completed
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Completed
                        </Badge>
                        {roster.placement !== null && (
                          <Badge variant="secondary">
                            #{roster.placement + 1}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        Final Points: {roster.points || 0}
                      </div>
                      {roster.wonRounds && (
                        <div className="flex items-center gap-1">
                          Record: {roster.wonRounds}W - {roster.lostRounds}L
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
