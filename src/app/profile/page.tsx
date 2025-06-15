import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Users, 
  Trophy, 
  Calendar, 
  Settings, 
  Mail,
  ExternalLink,
  Crown
} from "lucide-react"
import Link from "next/link"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user?.id) {
    redirect("/api/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    include: {
      titles: {
        orderBy: { created_at: 'desc' },
      },
      team_players: {
        include: {
          team: {
            include: {
              _count: {
                select: {
                  players: true,
                  rosters: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      },
      roster_players: {
        include: {
          roster: {
            include: {
              team: true,
              league: {
                include: {
                  format: true,
                },
              },
              division: true,
            },
          },
        },
        orderBy: { roster: { created_at: 'desc' } },
      },
      notifications: {
        where: { read: false },
        orderBy: { created_at: 'desc' },
        take: 5,
      },
      _count: {
        select: {
          team_players: true,
          roster_players: true,
          notifications: true,
        },
      },
    },
  })

  if (!user) {
    redirect("/api/auth/signin")
  }

  return (
    <div className="container mx-auto py-8">
      {/* Profile Header */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  {user.alias && (
                    <p className="text-lg text-muted-foreground">
                      aka {user.alias}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {user._count.team_players} {user._count.team_players === 1 ? 'team' : 'teams'}
                    </div>
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 mr-1" />
                      {user._count.roster_players} {user._count.roster_players === 1 ? 'roster' : 'rosters'}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* User badges */}
                  <div className="flex gap-2 mt-3">
                    {user.admin && (
                      <Badge variant="destructive" className="text-xs">
                        Administrator
                      </Badge>
                    )}
                    {user.banned && (
                      <Badge variant="destructive" className="text-xs">
                        Banned
                      </Badge>
                    )}
                    {!user.enabled && (
                      <Badge variant="secondary" className="text-xs">
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/profile/edit">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
                {user.steam_profile && (
                  <Button variant="outline" asChild>
                    <a href={user.steam_profile} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Steam Profile
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          {user.description && (
            <CardContent className="pt-0">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm whitespace-pre-wrap">{user.description}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Unread Notifications */}
      {user.notifications.length > 0 && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Recent Notifications
                <Badge variant="destructive" className="ml-2">
                  {user._count.notifications} unread
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.notifications.map((notification) => (
                  <div key={notification.id} className="p-3 border rounded-lg">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/notifications">View All Notifications</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList>
          <TabsTrigger value="teams">My Teams</TabsTrigger>
          <TabsTrigger value="rosters">League Rosters</TabsTrigger>
          <TabsTrigger value="titles">Titles & Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                My Teams ({user.team_players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.team_players.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {user.team_players.map((teamPlayer, index) => (
                    <div key={teamPlayer.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold flex items-center">
                            <Link 
                              href={`/teams/${teamPlayer.team.id}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {teamPlayer.team.name}
                            </Link>
                            {index === 0 && (
                              <Crown className="w-4 h-4 ml-2 text-yellow-500" title="Team Leader" />
                            )}
                          </h4>
                          {teamPlayer.team.tag && (
                            <p className="text-sm text-muted-foreground font-mono">
                              [{teamPlayer.team.tag}]
                            </p>
                          )}
                        </div>
                        {teamPlayer.team._count.rosters > 0 && (
                          <Badge variant="secondary">
                            {teamPlayer.team._count.rosters} active {teamPlayer.team._count.rosters === 1 ? 'roster' : 'rosters'}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {teamPlayer.team._count.players} members
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined {new Date(teamPlayer.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {teamPlayer.team.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {teamPlayer.team.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't joined any teams yet. Create one or get invited!
                  </p>
                  <Button asChild>
                    <Link href="/teams/create">Create Team</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rosters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                League Rosters ({user.roster_players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.roster_players.length > 0 ? (
                <div className="space-y-4">
                  {user.roster_players.map((rosterPlayer) => (
                    <div key={rosterPlayer.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">
                            <Link 
                              href={`/leagues/${rosterPlayer.roster.league.id}/rosters/${rosterPlayer.roster.id}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {rosterPlayer.roster.name}
                            </Link>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {rosterPlayer.roster.league.name} - TF2
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Team: <Link 
                              href={`/teams/${rosterPlayer.roster.team.id}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {rosterPlayer.roster.team.name}
                            </Link>
                          </p>
                          {rosterPlayer.roster.division && (
                            <p className="text-sm text-muted-foreground">
                              Division: {rosterPlayer.roster.division.name}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={rosterPlayer.roster.approved ? "default" : "secondary"}>
                            {rosterPlayer.roster.approved ? "Approved" : "Pending"}
                          </Badge>
                          {rosterPlayer.roster.disbanded && (
                            <Badge variant="destructive">Disbanded</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined {new Date(rosterPlayer.roster.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rosters yet</h3>
                  <p className="text-muted-foreground">
                    You haven't been added to any league rosters yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="titles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                Titles & Achievements ({user.titles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.titles.length > 0 ? (
                <div className="space-y-3">
                  {user.titles.map((title) => (
                    <div key={title.id} className="p-3 border rounded-lg">
                      <h4 className="font-semibold">{title.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Earned {new Date(title.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No titles yet</h3>
                  <p className="text-muted-foreground">
                    Participate in leagues and tournaments to earn titles!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
