import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users, 
  Shield, 
  Ban, 
  UserCheck, 
  Calendar,
  Mail,
  Eye,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { UserSearchForm } from "./user-search-form"
import { UserActions } from "./user-actions"

interface SearchParams {
  q?: string
  status?: string
  page?: string
}

interface AdminUsersPageProps {
  searchParams: Promise<SearchParams>
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user?.admin) {
    redirect("/")
  }

  const params = await searchParams
  const query = params.q || ""
  const status = params.status || "all"
  const page = parseInt(params.page || "1")
  const limit = 25
  const offset = (page - 1) * limit

  // Build where clause based on search and filters
  const whereClause: Record<string, unknown> = {}
  
  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { alias: { contains: query, mode: 'insensitive' } },
      { steam_id: { contains: query, mode: 'insensitive' } },
    ]
  }

  if (status === "banned") {
    whereClause.banned = true
  } else if (status === "disabled") {
    whereClause.enabled = false
  } else if (status === "admin") {
    whereClause.admin = true
  } else if (status === "active") {
    whereClause.banned = false
    whereClause.enabled = true
  }

  // Get users with pagination
  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
      include: {
        team_players: {
          include: {
            team: true
          }
        },
        _count: {
          select: {
            team_players: true,
            roster_players: true,
            forums_posts: true,
          }
        }
      }
    }),
    prisma.user.count({ where: whereClause })
  ])

  const totalPages = Math.ceil(totalUsers / limit)

  // Get summary stats
  const stats = await prisma.$transaction(async (tx) => {
    const total = await tx.user.count()
    const active = await tx.user.count({ where: { enabled: true, banned: false } })
    const banned = await tx.user.count({ where: { banned: true } })
    const disabled = await tx.user.count({ where: { enabled: false } })
    const admins = await tx.user.count({ where: { admin: true } })
    const recentSignups = await tx.user.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })

    return { total, active, banned, disabled, admins, recentSignups }
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Users className="w-8 h-8 mr-3" />
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage user accounts, permissions, and access
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.banned}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disabled</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.disabled}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.admins}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent (7d)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentSignups}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filter Users</CardTitle>
          <CardDescription>
            Search by name, email, alias, or Steam ID. Filter by user status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserSearchForm initialQuery={query} initialStatus={status} />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Showing {users.length} of {totalUsers} users
                {query && ` matching "${query}"`}
                {status !== "all" && ` with status: ${status}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/users?q=${query}&status=${status}&page=${page - 1}`}>
                    Previous
                  </Link>
                </Button>
              )}
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/users?q=${query}&status=${status}&page=${page + 1}`}>
                    Next
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || ""} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.name}
                          {user.admin && (
                            <Badge variant="destructive" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        {user.alias && (
                          <div className="text-sm text-muted-foreground">
                            aka: {user.alias}
                          </div>
                        )}
                        {user.steam_id && (
                          <div className="text-xs text-muted-foreground font-mono">
                            Steam: {user.steam_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {user.email || "No email"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user._count.team_players} team{user._count.team_players !== 1 ? 's' : ''}
                    </div>
                    {user.team_players.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Latest: {user.team_players[0]?.team.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div>{user._count.roster_players} roster{user._count.roster_players !== 1 ? 's' : ''}</div>
                      <div>{user._count.forums_posts} post{user._count.forums_posts !== 1 ? 's' : ''}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {user.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : !user.enabled ? (
                        <Badge variant="secondary">Disabled</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/users/${user.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                      <UserActions user={user} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Button variant="outline" asChild>
                <Link href={`/admin/users?q=${query}&status=${status}&page=${page - 1}`}>
                  Previous
                </Link>
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Button variant="outline" asChild>
                <Link href={`/admin/users?q=${query}&status=${status}&page=${page + 1}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
