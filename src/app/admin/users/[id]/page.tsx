import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { UserDetails } from "./user-details"

interface AdminUserPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminUserPage({ params }: AdminUserPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user?.admin) {
    redirect("/")
  }

  const { id } = await params
  const userId = parseInt(id)

  if (isNaN(userId)) {
    notFound()
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      admin_notes_about: {
        include: {
          admin: {
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
      _count: {
        select: {
          team_players: true,
          roster_players: true,
          forums_posts: true,
        }
      }
    }
  } as any)

  if (!user) {
    notFound()
  }

  return <UserDetails user={user as any} />
}
