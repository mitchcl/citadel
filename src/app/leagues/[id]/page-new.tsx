import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  ArrowLeft, 
  Plus,
  Medal,
  Gamepad2,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LeaguePageProps {
  params: { id: string }
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  const leagueId = parseInt(id)

  if (isNaN(leagueId)) {
    notFound()
  }

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      format: {
        include: {
          game: true,
        },
      },
      divisions: {
        include: {
          rosters: {
            include: {
              team: true,
              players: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      avatar: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  players: true,
                },
              },
            },
            orderBy: [
              { approved: 'desc' },
              { created_at: 'desc' },
            ],
          },
          matches: {
            include: {
              home_roster: {
                include: {
                  team: true,
                },
              },
              away_roster: {
                include: {
                  team: true,
                },
              },
            },
            orderBy: [
              { scheduled_at: 'asc' },
              { created_at: 'desc' },
            ],
          },
          _count: {
            select: {
              rosters: true,
              matches: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      },
      _count: {
        select: {
          rosters: true,
        },
      },
    },
  })

  if (!league) {
    notFound()
  }

  // Check if user has a team that can sign up
  const userTeams = session?.user?.id
    ? await prisma.team.findMany({
        where: {
          players: {
            some: {
              user_id: parseInt(session.user.id),
            },
          },
        },
        include: {
          rosters: {
            where: {
              league_id: leagueId,
            },
          },
        },
      })
    : []

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="secondary">Hidden</Badge>
      case 1:
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
      case 2:
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getMatchStatusBadge = (match: any) => {
    switch (match.status) {
      case 0:
        return <Badge variant="outline">Scheduled</Badge>
      case 1:
        return <Badge variant="default" className="bg-blue-600">Live</Badge>
      case 2:
        if (match.home_score !== null && match.away_score !== null) {
          return <Badge variant="default" className="bg-green-600">Completed</Badge>
        }
        return <Badge variant="secondary">Pending Results</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  // Calculate total matches and completed matches
  const totalMatches = league.divisions.reduce((acc, div) => acc + div._count.matches, 0)
  const completedMatches = league.divisions.reduce((acc, div) => 
    acc + div.matches.filter(m => m.status === 2 && m.home_score !== null && m.away_score !== null).length, 0
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/leagues">
              <ArrowLeft className="h-4 w-4" />
              Back to Leagues
            </Link>
          </Button>
        </div>

        {/* League Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                  <CardTitle className="text-2xl">{league.name}</CardTitle>
                  {getStatusBadge(league.status)}
                </div>
                <CardDescription className="text-base mb-4">
                  {league.description}
                </CardDescription>
                
                {/* Game and Format Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Gamepad2 className="h-4 w-4" />
                    <span>{league.format.game?.name || 'Game'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{league.format.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{league._count.rosters} team{league._count.rosters !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Medal className="h-4 w-4" />
                    <span>{league.divisions.length} division{league.divisions.length !== 1 ? 's' : ''}</span>
                  </div>
                  {totalMatches > 0 && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{completedMatches}/{totalMatches} matches complete</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {league.signuppable && userTeams.length > 0 && (
                  <Button asChild>
                    <Link href={`/leagues/${league.id}/signup`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Sign Up Team
                    </Link>
                  </Button>
                )}
                {session?.user?.admin && (
                  <Button variant="outline" asChild>
                    <Link href={`/admin/leagues/${league.id}`}>
                      Manage League
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* League Features */}
            <div className="flex flex-wrap gap-2 pt-4">
              {league.signuppable && (
                <Badge variant="outline" className="text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Open Signups
                </Badge>
              )}
              {league.roster_locked && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Rosters Locked
                </Badge>
              )}
              {league.matches_submittable && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active Matches
                </Badge>
              )}
              {league.transfers_require_approval && (
                <Badge variant="outline" className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  Managed Transfers
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {league.min_players}-{league.max_players} players per roster
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="divisions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="divisions">
              Divisions ({league.divisions.length})
            </TabsTrigger>
            <TabsTrigger value="matches">
              Recent Matches
            </TabsTrigger>
            <TabsTrigger value="info">
              League Info
            </TabsTrigger>
          </TabsList>

          {/* Divisions Tab */}
          <TabsContent value="divisions">
            <div className="space-y-6">
              {league.divisions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Medal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No divisions created yet</p>
                  </CardContent>
                </Card>
              ) : (
                league.divisions.map((division) => (
                  <Card key={division.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{division.name}</CardTitle>
                          <CardDescription>
                            {division._count.rosters} team{division._count.rosters !== 1 ? 's' : ''} • {division._count.matches} match{division._count.matches !== 1 ? 'es' : ''}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {division.rosters.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No teams yet</p>
                      ) : (
                        <div className="grid gap-3">
                          {division.rosters.map((roster) => (
                            <div key={roster.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{roster.team.name}</span>
                                    <Badge variant={roster.approved ? "default" : "secondary"} className="text-xs">
                                      {roster.approved ? "Approved" : "Pending"}
                                    </Badge>
                                    {roster.disbanded && (
                                      <Badge variant="destructive" className="text-xs">
                                        Disbanded
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {roster._count.players} player{roster._count.players !== 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {roster.players.slice(0, 4).map((player) => (
                                  <Avatar key={player.user.id} className="h-6 w-6">
                                    <AvatarImage src={player.user.avatar || undefined} alt={player.user.name} />
                                    <AvatarFallback className="text-xs">
                                      {player.user.name.substring(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {roster.players.length > 4 && (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                    +{roster.players.length - 4}
                                  </div>
                                )}
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/leagues/${league.id}/rosters/${roster.id}`}>
                                    View
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <div className="space-y-4">
              {totalMatches === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No matches scheduled yet</p>
                  </CardContent>
                </Card>
              ) : (
                league.divisions.map((division) => 
                  division.matches.length > 0 && (
                    <Card key={division.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{division.name} Matches</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {division.matches.slice(0, 10).map((match) => (
                            <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-4">
                                <div className="text-center min-w-0">
                                  <div className="font-medium truncate">{match.home_roster.team.name}</div>
                                  <div className="text-2xl font-bold">
                                    {match.home_score ?? '?'}
                                  </div>
                                </div>
                                <div className="text-muted-foreground text-sm">vs</div>
                                <div className="text-center min-w-0">
                                  <div className="font-medium truncate">{match.away_roster.team.name}</div>
                                  <div className="text-2xl font-bold">
                                    {match.away_score ?? '?'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                {getMatchStatusBadge(match)}
                                {match.scheduled_at && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(match.scheduled_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                )
              )}
            </div>
          </TabsContent>

          {/* League Info Tab */}
          <TabsContent value="info">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">League Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Player Count:</span>
                    <span>{league.format.player_count} per team</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Roster Size:</span>
                    <span>{league.min_players}-{league.max_players} players</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Signups:</span>
                    <span>{league.signuppable ? "Open" : "Closed"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rosters:</span>
                    <span>{league.roster_locked ? "Locked" : "Open"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Match Submissions:</span>
                    <span>{league.matches_submittable ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transfer Approval:</span>
                    <span>{league.transfers_require_approval ? "Required" : "Automatic"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Format Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Game:</span>
                    <span>{league.format.game?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span>{league.format.name}</span>
                  </div>
                  {league.format.description && (
                    <div>
                      <div className="font-medium mb-1">Description:</div>
                      <div className="text-muted-foreground">{league.format.description}</div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Max Players per Team:</span>
                    <span>{league.format.max_player_count || 'Unlimited'}</span>
                  </div>
                </CardContent>
              </Card>

              {league.category && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">League Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="text-sm">
                      {league.category}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
