import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Trophy, 
  Calendar, 
  User, 
  ExternalLink, 
  Users,
  MessageCircle,
  Shield,
  UserCheck
} from 'lucide-react'

interface UserProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params
  
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    include: {
      team_players: {
        include: {
          team: true,
        },
        orderBy: { created_at: 'desc' },
      },
      roster_players: {
        include: {
          roster: {
            include: {
              team: true,
              league: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      },
      ban_history: {
        include: {
          banned_by: {
            select: {
              id: true,
              name: true,
            }
          },
          unbanned_by: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      },
      titles: {
        orderBy: { created_at: 'desc' },
      },
      forums_posts: {
        include: {
          thread: {
            include: {
              topic: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          forums_posts: true,
          team_players: true,
          roster_players: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <Button variant="outline" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>

      {/* User Profile Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar || ''} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <div className="flex gap-2">
                  {user.admin && (
                    <Badge variant="destructive">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {user.enabled ? (
                    <Badge variant="outline">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Disabled
                    </Badge>
                  )}
                  {user.banned && (
                    <Badge variant="destructive">
                      Banned
                    </Badge>
                  )}
                </div>
              </div>
              
              {user.alias && (
                <p className="text-lg text-muted-foreground mb-2">
                  aka <span className="font-medium">{user.alias}</span>
                </p>
              )}

              {user.description && (
                <p className="text-muted-foreground mb-4">{user.description}</p>
              )}

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {user._count.team_players} teams
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {user._count.forums_posts} posts
                </div>
                {user.steam_profile && (
                  <Link 
                    href={user.steam_profile}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    Steam Profile
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* User Titles */}
      {user.titles.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Titles & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.titles.map((title) => (
                <Badge key={title.id} variant="secondary" className="text-sm">
                  <Trophy className="h-3 w-3 mr-1" />
                  {title.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="league-history">League History</TabsTrigger>
          <TabsTrigger value="forum-activity">Forum Activity</TabsTrigger>
          {user.ban_history.length > 0 && (
            <TabsTrigger value="ban-history">Ban History</TabsTrigger>
          )}
        </TabsList>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Current Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {user.team_players.length > 0 ? (
                <div className="space-y-4">
                  {user.team_players.map((tp) => (
                    <div key={tp.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <Link 
                          href={`/teams/${tp.team.id}`}
                          className="font-medium hover:underline"
                        >
                          {tp.team.name}
                        </Link>
                        {tp.team.tag && (
                          <Badge variant="outline" className="ml-2">
                            {tp.team.tag}
                          </Badge>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Joined {new Date(tp.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/teams/${tp.team.id}`}>
                          View Team
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Not currently on any teams.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* League History Tab */}
        <TabsContent value="league-history">
          <Card>
            <CardHeader>
              <CardTitle>League Participation</CardTitle>
            </CardHeader>
            <CardContent>
              {user.roster_players.length > 0 ? (
                <div className="space-y-4">
                  {user.roster_players.map((rp) => (
                    <div key={rp.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <div className="font-medium">{rp.roster.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {rp.roster.league.name} • Team: {rp.roster.team.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined roster {new Date(rp.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/leagues/${rp.roster.league.id}`}>
                          View League
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No league participation history.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forum Activity Tab */}
        <TabsContent value="forum-activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Forum Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {user.forums_posts.length > 0 ? (
                <div className="space-y-4">
                  {user.forums_posts.map((post) => (
                    <div key={post.id} className="p-4 border rounded">
                      <div className="flex items-start justify-between mb-2">
                        <Link 
                          href={`/forums/threads/${post.thread.id}#post-${post.id}`}
                          className="font-medium hover:underline"
                        >
                          {post.thread.title}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {post.thread.topic && (
                        <div className="text-sm text-muted-foreground mb-2">
                          in <Link href={`/forums/topics/${post.thread.topic.id}`} className="hover:underline">
                            {post.thread.topic.name}
                          </Link>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.content.length > 150 
                          ? `${post.content.substring(0, 150)}...`
                          : post.content
                        }
                      </p>
                    </div>
                  ))}
                  
                  {user._count.forums_posts > 10 && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Showing 10 of {user._count.forums_posts} posts
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No forum posts yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ban History Tab */}
        {user.ban_history.length > 0 && (
          <TabsContent value="ban-history">
            <Card>
              <CardHeader>
                <CardTitle>Ban History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.ban_history.map((ban) => (
                    <div 
                      key={ban.id} 
                      className={`border rounded p-4 ${ban.is_active ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50 opacity-75'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={ban.is_active ? "destructive" : "secondary"}
                          >
                            {ban.is_active ? "Current Ban" : "Past Ban"}
                          </Badge>
                          {ban.banned_until && (
                            <Badge variant="outline">
                              {ban.banned_until ? 
                                `Until ${new Date(ban.banned_until).toLocaleDateString()}` : 
                                "Permanent"
                              }
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(ban.banned_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {ban.ban_reason && (
                        <div className="mb-2">
                          <span className="text-sm font-medium">Reason:</span>{" "}
                          <span className="text-sm">{ban.ban_reason}</span>
                        </div>
                      )}
                      
                      {ban.unbanned_at && (
                        <div className="text-sm text-muted-foreground">
                          Ban removed on {new Date(ban.unbanned_at).toLocaleDateString()}
                          {ban.unban_reason && (
                            <div className="mt-1">
                              <span className="font-medium">Removal reason:</span> {ban.unban_reason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
