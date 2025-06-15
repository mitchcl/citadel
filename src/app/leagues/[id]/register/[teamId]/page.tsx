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
import { ArrowLeft, Users, AlertTriangle, CheckCircle } from "lucide-react"
import { RegistrationForm } from "./registration-form"

interface TeamRegistrationPageProps {
  params: { id: string; teamId: string }
}

export default async function TeamRegistrationPage({ params }: TeamRegistrationPageProps) {
  const session = await getServerSession(authOptions)
  const { id, teamId } = await params

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const leagueId = parseInt(id)
  const teamIdInt = parseInt(teamId)
  
  if (isNaN(leagueId) || isNaN(teamIdInt)) {
    notFound()
  }

  const [league, team] = await Promise.all([
    prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        format: true,
        divisions: {
          orderBy: { name: 'asc' }
        }
      }
    }),
    prisma.team.findUnique({
      where: { id: teamIdInt },
      include: {
        users: true,
        rosters: {
          where: {
            division: {
              league_id: leagueId
            }
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })
  ])

  if (!league || !team) {
    notFound()
  }

  // Check if user has permission to register this team
  const canRegister = team.captain_id === parseInt(session.user.id) || 
                     team.users.some(user => user.id === parseInt(session.user.id))

  if (!canRegister) {
    redirect(`/leagues/${league.id}/register`)
  }

  // Check if team is already registered
  if (team.rosters.length > 0) {
    return (
      <div className="container max-w-4xl py-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/leagues/${league.id}/register`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </Link>
        </Button>
        
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            This team is already registered for this league.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if team meets requirements
  if (team._count.users < league.min_players) {
    return (
      <div className="container max-w-4xl py-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/leagues/${league.id}/register`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </Link>
        </Button>
        
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This team doesn't meet the minimum player requirement ({league.min_players} players). 
            Current team size: {team._count.users} players.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={`/leagues/${league.id}/register`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Registration
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Register Team for {league.name}</h1>
        <p className="text-muted-foreground">
          Complete the registration for your team to join this league.
        </p>
      </div>

      {/* Team Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={team.avatar || ""} alt={team.name} />
              <AvatarFallback className="text-lg">{team.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{team.name}</h3>
              <p className="text-muted-foreground">
                {team._count.users} member{team._count.users !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Team Members</h4>
              <div className="space-y-2">
                {team.users.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar || ""} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                    {user.id === team.captain_id && (
                      <Badge variant="outline" className="text-xs">Captain</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">League Requirements</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Minimum players: {league.min_players} ✓</span>
                </div>
                {league.max_players > 0 && (
                  <div className="flex items-center gap-2">
                    {team._count.users <= league.max_players ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Maximum players: {league.max_players} ✓</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span>Maximum players: {league.max_players} (You have {team._count.users})</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Form */}
      <RegistrationForm 
        league={league} 
        team={team} 
        userId={parseInt(session.user.id)} 
      />
    </div>
  )
}
