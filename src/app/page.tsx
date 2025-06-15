import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Users, Trophy, Target, Clock, MessageSquare, ArrowRight } from "lucide-react"

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  // Fetch news threads from the News & Announcements topic (ID 1)
  const newsThreads = await prisma.forumsThread.findMany({
    where: {
      topic_id: 1, // News & Announcements topic
    },
    include: {
      created_by: true,
      posts: {
        take: 1,
        orderBy: { created_at: 'asc' },
        include: {
          created_by: true,
        },
      },
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: [
      { pinned: 'desc' },
      { created_at: 'desc' }
    ],
    take: 3,
  }).catch(() => []) // Handle case where news topic doesn't exist yet
  
  // Fetch active leagues
  const activeLeagues = await prisma.league.findMany({
    where: {
      status: 1, // running leagues
    },
    include: {
      format: true,
      _count: {
        select: {
          rosters: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 6,
  })

  // Fetch recent matches
  const recentMatches = await prisma.match.findMany({
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
          league: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 5,
  })

  return (
    <div className="min-h-screen bg-white">

      {/* News Section */}
      {newsThreads.length > 0 && (
        <div className="bg-white py-8">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">News</h1>
            </div>
            
            <div className="space-y-0">
              {newsThreads.map((thread, index) => {
                const firstPost = thread.posts[0]
                
                return (
                  <div key={thread.id}>
                    {index > 0 && <hr className="border-gray-300 my-6" />}
                    
                    <article className="mb-6">
                      {/* Post Header - similar to old Citadel */}
                      <div className="mb-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <time dateTime={thread.created_at}>
                            {new Date(thread.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </time>
                          <span className="text-xs text-gray-400">
                            {/* Show relative time */}
                            {(() => {
                              const now = new Date()
                              const postDate = new Date(thread.created_at)
                              const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60))
                              const diffInDays = Math.floor(diffInHours / 24)
                              
                              if (diffInDays > 0) {
                                return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
                              } else if (diffInHours > 0) {
                                return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
                              } else {
                                const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60))
                                return `${Math.max(1, diffInMinutes)} minute${diffInMinutes !== 1 ? 's' : ''} ago`
                              }
                            })()}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                          <Link 
                            href={`/forums/threads/${thread.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {thread.title}
                          </Link>
                        </h2>
                      </div>

                      {/* Post Content - styled like old Citadel card */}
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-6">
                          <div className="prose prose-gray max-w-none">
                            {firstPost?.content ? (
                              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                {firstPost.content}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No content available</p>
                            )}
                          </div>
                        </CardContent>
                        <div className="px-6 py-3 bg-white border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={thread.created_by.avatar || ""} alt={thread.created_by.name} />
                                  <AvatarFallback className="text-xs">{thread.created_by.name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-600">{thread.created_by.name}</span>
                              </div>
                              {thread.pinned && (
                                <Badge variant="secondary" className="text-xs">Pinned</Badge>
                              )}
                            </div>
                            <Link 
                              href={`/forums/threads/${thread.id}`}
                              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              comments ({thread._count.posts - 1})
                            </Link>
                          </div>
                        </div>
                      </Card>
                    </article>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-8 text-center">
              <Button variant="outline" asChild>
                <Link href="/forums/topics/1">
                  View Older News
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Platform Statistics
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Join thousands of competitive players
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col bg-gray-400/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Active Leagues</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  {activeLeagues.length}
                </dd>
              </div>
              <div className="flex flex-col bg-gray-400/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Total Teams</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  {activeLeagues.reduce((acc, league) => acc + league._count.rosters, 0)}
                </dd>
              </div>
              <div className="flex flex-col bg-gray-400/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Recent Matches</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  {recentMatches.length}
                </dd>
              </div>
              <div className="flex flex-col bg-gray-400/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Games Supported</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  1+
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Active Leagues Section */}
      {activeLeagues.length > 0 && (
        <div className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Active Leagues
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Join the competition in these running leagues
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {activeLeagues.map((league) => (
                <Card key={league.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">TF2</Badge>
                      <Badge variant="outline">{league.format.name}</Badge>
                    </div>
                    <CardTitle className="text-xl">{league.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {league.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {league._count.rosters} teams
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {league.category || 'General'}
                      </div>
                    </div>
                    <Button className="mt-4 w-full" asChild>
                      <Link href={`/leagues/${league.id}`}>View League</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Matches Section */}
      {recentMatches.length > 0 && (
        <div className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Recent Matches
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Latest competitive action across all leagues
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-4xl">
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <Card key={match.id} className="shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="font-semibold">{match.home_roster.team.name}</div>
                            <div className="text-sm text-gray-500">{match.home_roster.name}</div>
                          </div>
                          <div className="text-2xl font-bold text-gray-400">vs</div>
                          <div className="text-center">
                            <div className="font-semibold">{match.away_roster.team.name}</div>
                            <div className="text-sm text-gray-500">{match.away_roster.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{match.division.league.name}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(match.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
