import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Trophy, 
  Calendar, 
  Settings, 
  Plus,
  BarChart3,
  Activity,
  AlertCircle,
  Clock,
  AlertTriangle,
  Shield
} from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user?.admin) {
    redirect("/")
  }

  // Fetch dashboard statistics
  const stats = await prisma.$transaction(async (tx) => {
    const totalUsers = await tx.user.count()
    const activeUsers = await tx.user.count({ where: { enabled: true, banned: false } })
    const bannedUsers = await tx.user.count({ where: { banned: true } })
    
    const totalTeams = await tx.team.count()
    const totalLeagues = await tx.league.count()
    const activeLeagues = await tx.league.count({ where: { status: 1 } })
    
    const totalRosters = await tx.roster.count()
    const pendingRosters = await tx.roster.count({ where: { approved: false, disbanded: false } })
    
    const totalMatches = await tx.match.count()
    const pendingMatches = await tx.match.count({ where: { status: 0 } })

    // Recent forum posts (last 24 hours)
    const recentForumPosts = await tx.forumsPost.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    return {
      users: { total: totalUsers, active: activeUsers, banned: bannedUsers },
      teams: { total: totalTeams },
      leagues: { total: totalLeagues, active: activeLeagues },
      rosters: { total: totalRosters, pending: pendingRosters },
      matches: { total: totalMatches, pending: pendingMatches },
      recentForumPosts
    }
  })

  // Get recent pending rosters for quick access
  const pendingRostersList = await prisma.roster.findMany({
    where: { approved: false, disbanded: false },
    include: {
      team: true,
      division: {
        include: {
          league: true
        }
      },
      _count: {
        select: {
          players: true
        }
      }
    },
    orderBy: { created_at: 'desc' },
    take: 5
  })

  // Recent activity
  const recentTeams = await prisma.team.findMany({
    take: 5,
    orderBy: { created_at: 'desc' },
    include: {
      players: {
        include: { user: true },
        take: 1,
      },
    },
  })

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { created_at: 'desc' },
  })

  const pendingRosters = await prisma.roster.findMany({
    where: { approved: false, disbanded: false },
    take: 5,
    orderBy: { created_at: 'desc' },
    include: {
      team: true,
      league: true,
    },
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Shield className="w-8 h-8 mr-3" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage leagues, teams, and users
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.active} active, {stats.users.banned} banned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teams.total}</div>
            <p className="text-xs text-muted-foreground">
              Total registered teams
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leagues</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leagues.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.leagues.active} currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rosters.pending}</div>
            <p className="text-xs text-muted-foreground">
              Rosters awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>League Management</CardTitle>
            <CardDescription>Create and manage competitive leagues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin/leagues/create">
                <Plus className="w-4 h-4 mr-2" />
                Create League
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/admin/leagues">
                <Trophy className="w-4 h-4 mr-2" />
                Manage Leagues
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin/users">
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/admin/users/banned">
                <AlertCircle className="w-4 h-4 mr-2" />
                Banned Users
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure games, formats, and maps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin/games">
                <Settings className="w-4 h-4 mr-2" />
                Manage Games
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/admin/statistics">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Statistics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Rosters Section */}
      {pendingRostersList.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Pending Roster Approvals
                </CardTitle>
                <CardDescription>
                  {pendingRostersList.length} roster{pendingRostersList.length !== 1 ? 's' : ''} waiting for approval
                </CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin/rosters">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRostersList.map((roster) => (
                <div key={roster.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{roster.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {roster.team.name} • {roster.division?.league?.name || 'No League'} • {roster._count?.players || 0} players
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                    <Button size="sm" asChild>
                      <Link href={`/admin/rosters/${roster.id}`}>
                        Review
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Rosters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
              Pending Rosters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRosters.length > 0 ? (
              <div className="space-y-3">
                {pendingRosters.map((roster) => (
                  <div key={roster.id} className="p-3 border rounded-lg">
                    <h4 className="font-semibold text-sm">{roster.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {roster.team.name} → {roster.league?.name || 'No League'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(roster.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                <Button size="sm" asChild className="w-full">
                  <Link href="/admin/rosters/pending">View All</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending rosters</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Recent Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTeams.map((team) => (
                <div key={team.id} className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm">
                    <Link 
                      href={`/teams/${team.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {team.name}
                    </Link>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Created by {team.players[0]?.user.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(team.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              <Button size="sm" asChild className="w-full">
                <Link href="/teams">View All Teams</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-500" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm">
                    <Link 
                      href={`/users/${user.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {user.name}
                    </Link>
                  </h4>
                  <div className="flex gap-1 mt-1">
                    {user.admin && (
                      <Badge variant="destructive" className="text-xs">Admin</Badge>
                    )}
                    {user.banned && (
                      <Badge variant="destructive" className="text-xs">Banned</Badge>
                    )}
                    {!user.enabled && (
                      <Badge variant="secondary" className="text-xs">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              <Button size="sm" asChild className="w-full">
                <Link href="/admin/users">Manage Users</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
