import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Calendar, Target, Plus, Clock, Medal, Gamepad2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

const getStatusColor = (status: number) => {
  switch (status) {
    case 1:
      return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950"
    case 2:
      return "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950"
    default:
      return ""
  }
}

export default async function LeaguesPage() {
  const session = await getServerSession(authOptions)
  
  // Fetch all visible leagues (not hidden)
  const leagues = await prisma.league.findMany({
    where: {
      status: {
        not: 0, // Not hidden
      },
    },
    include: {
      format: {
        include: {
          game: true,
        },
      },
      divisions: {
        include: {
          _count: {
            select: {
              rosters: true,
              matches: true,
            },
          },
        },
      },
      _count: {
        select: {
          rosters: true,
        },
      },
    },
    orderBy: [
      { status: 'desc' }, // Running leagues first
      { created_at: 'desc' },
    ],
  })

  // Separate active and completed leagues
  const activeLeagues = leagues.filter(league => league.status === 1)
  const completedLeagues = leagues.filter(league => league.status === 2)

  // Get user's current rosters if logged in
  const userRosters = session?.user?.id
    ? await prisma.roster.findMany({
        where: {
          players: {
            some: {
              user_id: parseInt(session.user.id),
            },
          },
          disbanded: false,
        },
        include: {
          league: {
            include: {
              format: {
                include: {
                  game: true,
                },
              },
            },
          },
          team: true,
          division: true,
        },
      })
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Leagues</h1>
            <p className="text-muted-foreground">
              Compete in organized tournaments and seasonal leagues
            </p>
          </div>
          {session?.user?.admin && (
            <Button asChild>
              <Link href="/admin/leagues/create">
                <Plus className="h-4 w-4 mr-2" />
                Create League
              </Link>
            </Button>
          )}
        </div>

        {/* User's Current Leagues */}
        {userRosters.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Active Rosters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRosters.map((roster) => (
                <Card key={roster.id} className="hover:shadow-md transition-shadow border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <CardTitle className="text-lg">{roster.team.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {roster.league.format.game?.name} • {roster.league.format.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{roster.league.name}</div>
                      {roster.division && (
                        <div className="text-sm text-muted-foreground">
                          Division: {roster.division.name}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant={roster.approved ? "default" : "secondary"}>
                          {roster.approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <Button asChild className="w-full" size="sm">
                        <Link href={`/leagues/${roster.league.id}/rosters/${roster.id}`}>
                          View Roster
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Leagues Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Active Leagues ({activeLeagues.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed Leagues ({completedLeagues.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Leagues */}
          <TabsContent value="active">
            {activeLeagues.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active leagues at the moment</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back later for new competitions!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeLeagues.map((league) => (
                  <Card key={league.id} className={`hover:shadow-md transition-shadow ${getStatusColor(league.status)}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Trophy className="h-5 w-5 text-yellow-600" />
                            <CardTitle className="text-xl">{league.name}</CardTitle>
                            {getStatusBadge(league.status)}
                          </div>
                          <CardDescription className="text-base">
                            {league.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Game and Format Info */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Gamepad2 className="h-4 w-4" />
                            <span>{league.format.game?.name || 'Game'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{league.format.name}</span>
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{league._count.rosters} team{league._count.rosters !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Medal className="h-4 w-4 text-muted-foreground" />
                            <span>{league.divisions.length} division{league.divisions.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* League Features */}
                        <div className="flex flex-wrap gap-2">
                          {league.signuppable && (
                            <Badge variant="outline" className="text-xs">
                              <Plus className="h-3 w-3 mr-1" />
                              Open Signups
                            </Badge>
                          )}
                          {league.matches_submittable && (
                            <Badge variant="outline" className="text-xs">
                              Active Matches
                            </Badge>
                          )}
                          {league.transfers_require_approval && (
                            <Badge variant="outline" className="text-xs">
                              Managed Transfers
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button asChild className="flex-1">
                            <Link href={`/leagues/${league.id}`}>
                              View League
                            </Link>
                          </Button>
                          {league.signuppable && session && (
                            <Button asChild variant="outline">
                              <Link href={`/leagues/${league.id}/signup`}>
                                Sign Up
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Leagues */}
          <TabsContent value="completed">
            {completedLeagues.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Medal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed leagues yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {completedLeagues.map((league) => (
                  <Card key={league.id} className={`hover:shadow-md transition-shadow ${getStatusColor(league.status)}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Medal className="h-5 w-5 text-gray-600" />
                            <CardTitle className="text-xl">{league.name}</CardTitle>
                            {getStatusBadge(league.status)}
                          </div>
                          <CardDescription className="text-base">
                            {league.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Game and Format Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Gamepad2 className="h-4 w-4" />
                            <span>{league.format.game?.name || 'Game'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{league.format.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Completed</span>
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{league._count.rosters} team{league._count.rosters !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Medal className="h-4 w-4" />
                            <span>{league.divisions.length} division{league.divisions.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2">
                          <Button asChild variant="outline" className="w-full">
                            <Link href={`/leagues/${league.id}`}>
                              View Results
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
