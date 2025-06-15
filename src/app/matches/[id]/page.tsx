import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Flag,
  MapPin
} from "lucide-react"

interface MatchPageProps {
  params: { id: string }
}

const getStatusBadge = (status: number) => {
  switch (status) {
    case 0:
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 1:
      return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Live</Badge>
    case 2:
      return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Completed</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

export default async function MatchPage({ params }: MatchPageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  const matchId = parseInt(id)

  if (isNaN(matchId)) {
    notFound()
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      division: {
        include: {
          league: {
            include: {
              format: true,
            },
          },
        },
      },
      home_roster: {
        include: {
          team: true,
          players: {
            include: {
              user: true,
            },
          },
        },
      },
      away_roster: {
        include: {
          team: true,
          players: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  })

  if (!match) {
    notFound()
  }

  // Check if current user can manage this match (admin or team member)
  const canManage = session?.user && (
    session.user.admin ||
    match.home_roster.players.some(p => p.user.id === parseInt(session.user.id)) ||
    match.away_roster.players.some(p => p.user.id === parseInt(session.user.id))
  )

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/matches">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Link>
        </Button>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {match.home_roster.team.name} vs {match.away_roster.team.name}
            </h1>
            <p className="text-muted-foreground">
              {match.division.league.name} - {match.division.name} - Round {match.round}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(match.status)}
            {canManage && (
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Match Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Teams Matchup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Matchup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-8">
                {/* Home Team */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={match.home_roster.team.avatar || ""} />
                    <AvatarFallback className="text-lg">
                      {match.home_roster.team.tag || match.home_roster.team.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{match.home_roster.team.name}</h3>
                    {match.home_roster.team.tag && (
                      <p className="text-sm text-muted-foreground">[{match.home_roster.team.tag}]</p>
                    )}
                  </div>
                </div>

                {/* VS and Score */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-4xl font-bold text-muted-foreground">VS</div>
                  {match.status === 2 && (
                    <div className="text-2xl font-bold">
                      {match.home_score || 0} - {match.away_score || 0}
                    </div>
                  )}
                  {match.status === 1 && (
                    <Badge variant="default" className="text-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={match.away_roster.team.avatar || ""} />
                    <AvatarFallback className="text-lg">
                      {match.away_roster.team.tag || match.away_roster.team.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{match.away_roster.team.name}</h3>
                    {match.away_roster.team.tag && (
                      <p className="text-sm text-muted-foreground">[{match.away_roster.team.tag}]</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for detailed info */}
          <Tabs defaultValue="rosters" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rosters">Rosters</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rosters" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Home Roster */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {match.home_roster.team.name} Roster
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {match.home_roster.players.map((player, index) => (
                        <div key={player.id} className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={player.user.avatar || ""} />
                            <AvatarFallback>{player.user.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.user.name}</p>
                            {player.user.alias && (
                              <p className="text-sm text-muted-foreground">@{player.user.alias}</p>
                            )}
                          </div>
                          {index === 0 && (
                            <Badge variant="outline" className="ml-auto">
                              <Flag className="w-3 h-3 mr-1" />
                              Leader
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Away Roster */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {match.away_roster.team.name} Roster
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {match.away_roster.players.map((player, index) => (
                        <div key={player.id} className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={player.user.avatar || ""} />
                            <AvatarFallback>{player.user.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.user.name}</p>
                            {player.user.alias && (
                              <p className="text-sm text-muted-foreground">@{player.user.alias}</p>
                            )}
                          </div>
                          {index === 0 && (
                            <Badge variant="outline" className="ml-auto">
                              <Flag className="w-3 h-3 mr-1" />
                              Leader
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Match Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">League Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">League:</span>
                          <span>{match.division.league.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Division:</span>
                          <span>{match.division.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Format:</span>
                          <span>TF2 - {match.division.league.format.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Round:</span>
                          <span>{match.round}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Match Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span>{getStatusBadge(match.status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span>{new Date(match.created_at).toLocaleDateString()}</span>
                        </div>
                        {match.scheduled_at && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Scheduled:</span>
                            <span>{new Date(match.scheduled_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Match Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {match.status === 2 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold mb-4">
                        {match.home_score || 0} - {match.away_score || 0}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        {(match.home_score || 0) > (match.away_score || 0) 
                          ? `${match.home_roster.team.name} wins!`
                          : (match.away_score || 0) > (match.home_score || 0)
                          ? `${match.away_roster.team.name} wins!`
                          : "Match tied!"
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="mx-auto w-12 h-12 mb-4" />
                      <p>Results will be available after the match is completed.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href={`/leagues/${match.division.league.id}`}>
                  <Trophy className="w-4 h-4 mr-2" />
                  View League
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/teams/${match.home_roster.team.id}`}>
                  <Users className="w-4 h-4 mr-2" />
                  {match.home_roster.team.name}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/teams/${match.away_roster.team.id}`}>
                  <Users className="w-4 h-4 mr-2" />
                  {match.away_roster.team.name}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Match Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Match Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format:</span>
                <span>{match.division.league.format.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Players per team:</span>
                <span>{match.division.league.format.player_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Home roster size:</span>
                <span>{match.home_roster.players.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Away roster size:</span>
                <span>{match.away_roster.players.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
