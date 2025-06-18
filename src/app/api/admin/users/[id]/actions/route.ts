import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { action } = await request.json()
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Prevent admin from acting on themselves in certain ways
    const currentUserId = parseInt(session.user.id)
    if (userId === currentUserId && ['ban', 'disable', 'delete', 'remove_admin'].includes(action)) {
      return NextResponse.json({ 
        error: 'You cannot perform this action on yourself' 
      }, { status: 400 })
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}
    let actionDescription = ''

    switch (action) {
      case 'ban':
        updateData = { banned: true, enabled: false }
        actionDescription = 'banned'
        break
      case 'unban':
        updateData = { banned: false, enabled: true }
        actionDescription = 'unbanned'
        break
      case 'enable':
        updateData = { enabled: true, banned: false }
        actionDescription = 'enabled'
        break
      case 'disable':
        updateData = { enabled: false }
        actionDescription = 'disabled'
        break
      case 'make_admin':
        updateData = { admin: true }
        actionDescription = 'promoted to admin'
        break
      case 'remove_admin':
        // Prevent removing the last admin
        const adminCount = await prisma.user.count({ where: { admin: true } })
        if (adminCount <= 1) {
          return NextResponse.json({ 
            error: 'Cannot remove the last admin user' 
          }, { status: 400 })
        }
        updateData = { admin: false }
        actionDescription = 'admin status removed'
        break
      case 'delete':
        // This is a destructive operation - we should be very careful
        // In a production environment, you might want to implement soft delete instead
        await prisma.$transaction(async (tx) => {
          // Delete related records first (or handle with CASCADE)
          await tx.teamPlayer.deleteMany({ where: { user_id: userId } })
          await tx.rosterPlayer.deleteMany({ where: { user_id: userId } })
          await tx.teamInvite.deleteMany({ where: { user_id: userId } })
          await tx.forumsPost.deleteMany({ where: { created_by_id: userId } })
          await tx.forumsThread.deleteMany({ where: { created_by_id: userId } })
          
          // Finally delete the user
          await tx.user.delete({ where: { id: userId } })
        })
        
        return NextResponse.json({ 
          message: `User ${targetUser.name} has been deleted successfully` 
        })
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Log the admin action (in a real app, you'd want proper audit logging)
    console.log(`Admin ${session.user.name} (${session.user.id}) ${actionDescription} user ${targetUser.name} (${userId})`)

    return NextResponse.json({ 
      message: `User ${targetUser.name} has been ${actionDescription} successfully`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error in user actions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
