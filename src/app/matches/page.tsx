import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Users, 
  Eye,
  CheckCircle,
  XCircle,
  Minus
} from "lucide-react"

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

const getStatusColor = (status: number) => {
  switch (status) {
    case 0:
      return "border-yellow-200 bg-yellow-50"
    case 1:
      return "border-green-200 bg-green-50"
    case 2:
      return "border-gray-200 bg-gray-50"
    default:
      return ""
  }
}

export default async function MatchesPage() {
  const session = await getServerSession(authOptions)
  
  // Fetch all matches
  const matches = await prisma.match.findMany({
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
        },
      },
      away_roster: {
        include: {
          team: true,
        },
      },
    },
    orderBy: [
      { status: 'asc' }, // Pending first
      { round: 'asc' },
      { created_at: 'desc' },
    ],
  })

  // Group matches by status
  const pendingMatches = matches.filter(match => match.status === 0)
  const liveMatches = matches.filter(match => match.status === 1)
  const completedMatches = matches.filter(match => match.status === 2)

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground">
            League matches and results
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Matches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Waiting to be played
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Matches finished
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
            Live Matches
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveMatches.map((match) => (
              <Card key={match.id} className={`${getStatusColor(match.status)} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Round {match.round}
                    </CardTitle>
                    {getStatusBadge(match.status)}
                  </div>
                  <CardDescription className="text-sm">
                    {match.division.league.name} - {match.division.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={match.home_roster.team.avatar || ""} />
                        <AvatarFallback>{match.home_roster.team.tag || match.home_roster.team.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{match.home_roster.team.name}</span>
                    </div>
                    <span className="text-2xl font-bold">vs</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{match.away_roster.team.name}</span>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={match.away_roster.team.avatar || ""} />
                        <AvatarFallback>{match.away_roster.team.tag || match.away_roster.team.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      "TF2" - {match.division.league.format.name}
                    </Badge>
                    <Button asChild size="sm">
                      <Link href={`/matches/${match.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Matches */}
      {pendingMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-yellow-600" />
            Pending Matches
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingMatches.map((match) => (
              <Card key={match.id} className={`${getStatusColor(match.status)} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Round {match.round}
                    </CardTitle>
                    {getStatusBadge(match.status)}
                  </div>
                  <CardDescription className="text-sm">
                    {match.division.league.name} - {match.division.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={match.home_roster.team.avatar || ""} />
                        <AvatarFallback>{match.home_roster.team.tag || match.home_roster.team.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{match.home_roster.team.name}</span>
                    </div>
                    <span className="text-2xl font-bold">vs</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{match.away_roster.team.name}</span>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={match.away_roster.team.avatar || ""} />
                        <AvatarFallback>{match.away_roster.team.tag || match.away_roster.team.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      "TF2" - {match.division.league.format.name}
                    </Badge>
                    <Button asChild size="sm">
                      <Link href={`/matches/${match.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-gray-600" />
            Completed Matches
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedMatches.map((match) => (
              <Card key={match.id} className={`${getStatusColor(match.status)} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Round {match.round}
                    </CardTitle>
                    {getStatusBadge(match.status)}
                  </div>
                  <CardDescription className="text-sm">
                    {match.division.league.name} - {match.division.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={match.home_roster.team.avatar || ""} />
                        <AvatarFallback>{match.home_roster.team.tag || match.home_roster.team.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{match.home_roster.team.name}</span>
                    </div>
                    <span className="text-2xl font-bold">vs</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{match.away_roster.team.name}</span>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={match.away_roster.team.avatar || ""} />
                        <AvatarFallback>{match.away_roster.team.tag || match.away_roster.team.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      "TF2" - {match.division.league.format.name}
                    </Badge>
                    <Button asChild size="sm">
                      <Link href={`/matches/${match.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground">
              Matches will appear here when leagues start scheduling games.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
