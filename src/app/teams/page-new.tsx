import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Plus, Search, Calendar, Trophy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

interface SearchParams {
  search?: string
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getServerSession(authOptions)
  const params = await searchParams
  const searchQuery = params?.search || ""

  // Fetch teams with search functionality
  const teams = await prisma.team.findMany({
    where: searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { tag: { contains: searchQuery, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: {
      players: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              steam_id: true,
            },
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      },
      rosters: {
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
          division: true,
        },
        where: {
          disbanded: false,
        },
      },
      _count: {
        select: {
          players: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  // Get user's teams if logged in
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
        },
      })
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Teams</h1>
            <p className="text-muted-foreground">
              Browse teams or create your own to compete in leagues
            </p>
          </div>
          {session && (
            <Button asChild>
              <Link href="/teams/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Link>
            </Button>
          )}
        </div>

        {/* User's Teams */}
        {userTeams.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Teams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTeams.map((team) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      {team.avatar && (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={team.avatar} alt={team.name} />
                          <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.tag && (
                          <Badge variant="secondary" className="text-xs">
                            {team.tag}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Users className="h-4 w-4" />
                      {team.players.length} player{team.players.length !== 1 ? 's' : ''}
                    </div>
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/teams/${team.id}`}>
                        View Team
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search teams by name or tag..."
              className="pl-10"
              defaultValue={searchQuery}
            />
          </div>
        </div>

        {/* All Teams */}
        <div>
          <h2 className="text-xl font-semibold mb-4">All Teams</h2>
          {teams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No teams found matching your search.' : 'No teams created yet.'}
                </p>
                {session && !searchQuery && (
                  <Button asChild className="mt-4">
                    <Link href="/teams/create">
                      Create the First Team
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {team.avatar && (
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={team.avatar} alt={team.name} />
                          <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.tag && (
                          <Badge variant="secondary" className="text-xs">
                            {team.tag}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {team.description && (
                      <CardDescription className="line-clamp-2">
                        {team.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {team._count.players} player{team._count.players !== 1 ? 's' : ''}
                      </div>

                      {team.rosters.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Trophy className="h-4 w-4" />
                            Active in {team.rosters.length} league{team.rosters.length !== 1 ? 's' : ''}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {team.rosters.slice(0, 3).map((roster) => (
                              <Badge key={roster.id} variant="outline" className="text-xs">
                                {roster.league.format.game?.name || 'Game'} {roster.league.format.name}
                              </Badge>
                            ))}
                            {team.rosters.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{team.rosters.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recent players */}
                      {team.players.length > 0 && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Players</div>
                          <div className="flex -space-x-2">
                            {team.players.slice(0, 5).map((player) => (
                              <Avatar key={player.user.id} className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={player.user.avatar || undefined} alt={player.user.name} />
                                <AvatarFallback className="text-xs">
                                  {player.user.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {team.players.length > 5 && (
                              <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                +{team.players.length - 5}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Button asChild className="w-full" variant="outline">
                        <Link href={`/teams/${team.id}`}>
                          View Team
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
