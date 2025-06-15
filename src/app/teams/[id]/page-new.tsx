import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  Calendar, 
  Trophy, 
  Settings, 
  UserPlus, 
  ArrowLeft,
  Mail,
  Crown,
  ExternalLink,
  Shield,
  Clock
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TeamPageProps {
  params: { id: string }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  const teamId = parseInt(id)

  if (isNaN(teamId)) {
    notFound()
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      players: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              steam_id: true,
              steam_profile: true,
              admin: true,
              created_at: true,
              titles: {
                orderBy: { created_at: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { created_at: 'asc' },
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
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
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
        orderBy: {
          created_at: 'desc',
        },
      },
      invites: {
        where: {
          accepted_at: null,
          declined_at: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      },
    },
  })

  if (!team) {
    notFound()
  }

  // Check if current user is a team member
  const isTeamMember = team.players.some(
    (player) => player.user.id === parseInt(session?.user?.id || '0')
  )

  // Get recent matches for the team's rosters
  const recentMatches = await prisma.match.findMany({
    where: {
      OR: [
        { home_roster: { team_id: teamId } },
        { away_roster: { team_id: teamId } },
      ],
    },
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
      division: {
        include: {
          league: {
            include: {
              format: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 5,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teams">
              <ArrowLeft className="h-4 w-4" />
              Back to Teams
            </Link>
          </Button>
        </div>

        {/* Team Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex items-center gap-4">
                {team.avatar && (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={team.avatar} alt={team.name} />
                    <AvatarFallback className="text-lg">
                      {team.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{team.name}</CardTitle>
                    {team.tag && (
                      <Badge variant="secondary">
                        {team.tag}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {team.players.length} member{team.players.length !== 1 ? 's' : ''}
                    </div>
                    {team.rosters.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        {team.rosters.length} roster{team.rosters.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {new Date(team.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-auto">
                {session && isTeamMember && (
                  <>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/teams/${team.id}/edit`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/teams/${team.id}/recruit`}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Recruit
                      </Link>
                    </Button>
                  </>
                )}
                {session && !isTeamMember && (
                  <Button size="sm" disabled>
                    Request to Join
                  </Button>
                )}
              </div>
            </div>

            {team.description && (
              <CardDescription className="text-base mt-4">
                {team.description}
              </CardDescription>
            )}

            {team.notice && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Team Notice</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {team.notice}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Pending Invites (only visible to team members) */}
        {isTeamMember && team.invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={invite.user.avatar || undefined} alt={invite.user.name} />
                        <AvatarFallback className="text-xs">
                          {invite.user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{invite.user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Invited {new Date(invite.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="rosters">Rosters</TabsTrigger>
            <TabsTrigger value="matches">Recent Matches</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {team.players.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={player.user.avatar || undefined} alt={player.user.name} />
                          <AvatarFallback>
                            {player.user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.user.name}</span>
                            {index === 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Founder
                              </Badge>
                            )}
                            {player.user.admin && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {player.user.titles.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {player.user.titles[0].name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Joined {new Date(player.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {player.user.steam_profile && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={player.user.steam_profile} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/users/${player.user.id}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rosters Tab */}
          <TabsContent value="rosters">
            <div className="space-y-4">
              {team.rosters.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No rosters yet</p>
                    {isTeamMember && (
                      <Button asChild className="mt-4">
                        <Link href="/leagues">
                          Join a League
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                team.rosters.map((roster) => (
                  <Card key={roster.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{roster.name}</CardTitle>
                          <CardDescription>
                            {roster.league.format.game?.name} • {roster.league.format.name} • {roster.league.name}
                            {roster.division && ` • ${roster.division.name}`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={roster.approved ? "default" : "secondary"}>
                            {roster.approved ? "Approved" : "Pending Approval"}
                          </Badge>
                          {roster.disbanded && (
                            <Badge variant="destructive">Disbanded</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {roster._count.players} player{roster._count.players !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created {new Date(roster.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/leagues/${roster.league.id}/rosters/${roster.id}`}>
                            View Roster
                          </Link>
                        </Button>
                      </div>
                      {roster.description && (
                        <p className="text-sm text-muted-foreground mt-3">
                          {roster.description}
                        </p>
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
              {recentMatches.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No matches yet</p>
                  </CardContent>
                </Card>
              ) : (
                recentMatches.map((match) => {
                  const isHome = match.home_roster.team.id === teamId
                  const opponent = isHome ? match.away_roster.team : match.home_roster.team
                  const teamScore = isHome ? match.home_score : match.away_score
                  const opponentScore = isHome ? match.away_score : match.home_score
                  
                  return (
                    <Card key={match.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="font-medium">{team.name}</div>
                              <div className="text-2xl font-bold">
                                {teamScore ?? '?'}
                              </div>
                            </div>
                            <div className="text-muted-foreground">vs</div>
                            <div className="text-center">
                              <div className="font-medium">{opponent.name}</div>
                              <div className="text-2xl font-bold">
                                {opponentScore ?? '?'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                match.status === 2
                                  ? teamScore !== null && opponentScore !== null
                                    ? teamScore > opponentScore
                                      ? "default"
                                      : teamScore < opponentScore
                                      ? "destructive"
                                      : "secondary"
                                    : "secondary"
                                  : "outline"
                              }
                            >
                              {match.status === 0
                                ? "Scheduled"
                                : match.status === 1
                                ? "Live"
                                : teamScore !== null && opponentScore !== null
                                ? teamScore > opponentScore
                                  ? "Won"
                                  : teamScore < opponentScore
                                  ? "Lost"
                                  : "Tied"
                                : "Completed"}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {match.division.league.format.name}
                            </div>
                            {match.scheduled_at && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(match.scheduled_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
