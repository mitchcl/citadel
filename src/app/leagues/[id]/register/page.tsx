import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { ArrowLeft, Users, AlertTriangle, CheckCircle, Plus } from "lucide-react"
import { RegistrationForm } from "./registration-form"

interface RegistrationPageProps {
  params: { id: string }
}

export default async function LeagueRegistrationPage({ params }: RegistrationPageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const leagueId = parseInt(id)
  if (isNaN(leagueId)) {
    notFound()
  }

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      format: true,
      divisions: {
        orderBy: { name: 'asc' }
      }
    }
  })

  if (!league) {
    notFound()
  }

  if (!league.signuppable) {
    return (
      <div className="container max-w-4xl py-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/leagues/${league.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to League
          </Link>
        </Button>
        
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Registration is currently closed for this league.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Get user's teams that are eligible for registration
  const userTeams = await prisma.team.findMany({
    where: {
      OR: [
        { captain_id: parseInt(session.user.id) },
        {
          users: {
            some: { id: parseInt(session.user.id) }
          }
        }
      ]
    },
    include: {
      _count: {
        select: {
          users: true
        }
      },
      rosters: {
        where: {
          division: {
            league_id: league.id
          }
        },
        include: {
          division: true
        }
      }
    }
  })

  // Filter teams that meet the requirements and aren't already registered
  const eligibleTeams = userTeams.filter(team => 
    team._count.users >= league.min_players && 
    team.rosters.length === 0 // Not already registered
  )

  const alreadyRegistered = userTeams.filter(team => team.rosters.length > 0)

  return (
    <div className="container max-w-4xl py-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={`/leagues/${league.id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to League
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Register for {league.name}</h1>
        <p className="text-muted-foreground">
          Choose a team to register for this league. You must be the team captain or have permission to register the team.
        </p>
      </div>

      {/* League Requirements */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>League Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Team Size</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Minimum players: {league.min_players}</div>
                <div>Maximum players: {league.max_players === 0 ? 'Unlimited' : league.max_players}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Format</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Game mode: {league.format.name}</div>
                <div>Players in match: {league.format.player_count}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Already Registered Teams */}
      {alreadyRegistered.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Already Registered</h2>
          <div className="grid gap-4">
            {alreadyRegistered.map((team) => (
              <Card key={team.id} className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={team.avatar || ""} alt={team.name} />
                        <AvatarFallback>{team.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Registered in {team.rosters[0].division.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Registered
                      </Badge>
                      <Link href={`/teams/${team.id}`}>
                        <Button variant="outline" size="sm">
                          View Team
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Eligible Teams */}
      {eligibleTeams.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Team to Register</h2>
          <div className="grid gap-4">
            {eligibleTeams.map((team) => (
              <Card key={team.id} className="cursor-pointer hover:border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={team.avatar || ""} alt={team.name} />
                        <AvatarFallback>{team.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {team._count.users} member{team._count.users !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        Eligible
                      </Badge>
                      <Link href={`/leagues/${league.id}/register/${team.id}`}>
                        <Button>
                          Register Team
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No eligible teams</h3>
              <p className="text-muted-foreground text-center mb-4">
                You don't have any teams that meet the requirements for this league, or all your teams are already registered.
              </p>
              <div className="text-sm text-muted-foreground mb-4 space-y-1">
                <div>• Teams must have at least {league.min_players} members</div>
                <div>• You must be the team captain or have registration permissions</div>
                <div>• Teams can only register once per league</div>
              </div>
              <Link href="/teams/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Team
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Team Requirements:</strong> Your team must have at least {league.min_players} members to register for this league.
            </p>
            <p>
              <strong>Permissions:</strong> Only team captains can register teams for leagues. If you need to register a team but aren't the captain, contact your team captain.
            </p>
            <p>
              <strong>Questions?</strong> Check the league rules or contact an admin for help with registration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
