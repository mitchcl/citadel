import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Users as UsersIcon, Search, Trophy, Calendar, User } from 'lucide-react'

interface UsersPageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { search, page } = await searchParams
  const searchQuery = search || ""
  const currentPage = parseInt(page || "1")
  const pageSize = 20

  // Fetch users with search functionality
  const users = await prisma.user.findMany({
    where: searchQuery ? {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { alias: { contains: searchQuery, mode: 'insensitive' } },
      ],
    } : {},
    include: {
      team_players: {
        include: {
          team: true,
        },
      },
      titles: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          forums_posts: true,
          team_players: true,
        },
      },
    },
    orderBy: [
      { admin: 'desc' },
      { created_at: 'desc' },
    ],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })

  const totalUsers = await prisma.user.count({
    where: searchQuery ? {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { alias: { contains: searchQuery, mode: 'insensitive' } },
      ],
    } : {},
  })

  const totalPages = Math.ceil(totalUsers / pageSize)

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UsersIcon className="h-8 w-8" />
            Users
          </h1>
          <p className="text-muted-foreground">
            Browse our community members ({totalUsers} total)
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  name="search"
                  placeholder="Search users by name or alias..."
                  defaultValue={searchQuery}
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit">Search</Button>
            {searchQuery && (
              <Button variant="outline" asChild>
                <Link href="/users">Clear</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar || ''} alt={user.name} />
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/users/${user.id}`}
                      className="font-semibold hover:underline truncate"
                    >
                      {user.name}
                    </Link>
                    {user.admin && (
                      <Badge variant="destructive" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                  {user.alias && (
                    <p className="text-sm text-muted-foreground truncate">
                      aka {user.alias}
                    </p>
                  )}
                  {user.titles.length > 0 && (
                    <Badge variant="outline" className="text-xs mt-1">
                      <Trophy className="h-3 w-3 mr-1" />
                      {user.titles[0].name}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {user.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {user.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <UsersIcon className="h-3 w-3" />
                    {user._count.team_players} teams
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {user._count.forums_posts} posts
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(user.created_at).getFullYear()}
                </div>
              </div>

              {/* Current Teams */}
              {user.team_players.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Current Teams:</p>
                  <div className="flex flex-wrap gap-1">
                    {user.team_players.slice(0, 2).map((tp) => (
                      <Badge key={tp.id} variant="secondary" className="text-xs">
                        <Link href={`/teams/${tp.team.id}`} className="hover:underline">
                          {tp.team.name}
                        </Link>
                      </Badge>
                    ))}
                    {user.team_players.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.team_players.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery ? `No users found matching "${searchQuery}"` : "No users found."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {currentPage > 1 && (
            <Button variant="outline" asChild>
              <Link href={`/users?page=${currentPage - 1}${searchQuery ? `&search=${searchQuery}` : ''}`}>
                Previous
              </Link>
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link href={`/users?page=${pageNum}${searchQuery ? `&search=${searchQuery}` : ''}`}>
                    {pageNum}
                  </Link>
                </Button>
              )
            })}
          </div>

          {currentPage < totalPages && (
            <Button variant="outline" asChild>
              <Link href={`/users?page=${currentPage + 1}${searchQuery ? `&search=${searchQuery}` : ''}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
