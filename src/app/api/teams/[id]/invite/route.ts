import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Handle team invitations acceptance/decline
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = parseInt(params.id)
    const body = await request.json()
    const { action } = body // "accept" or "decline"

    // Find the pending invite
    const invite = await prisma.teamInvite.findFirst({
      where: {
        team_id: teamId,
        user_id: parseInt(session.user.id!),
        accepted_at: null,
        declined_at: null,
      },
      include: {
        team: true,
      },
    })

    if (!invite) {
      return NextResponse.json(
        { error: "No pending invite found" },
        { status: 404 }
      )
    }

    if (action === "accept") {
      // Check if user is already on another team (if your league rules require it)
      // For now, we'll allow users to be on multiple teams
      
      // Add user to team
      await prisma.teamPlayer.create({
        data: {
          team_id: teamId,
          user_id: parseInt(session.user.id!),
        },
      })

      // Mark invite as accepted
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { accepted_at: new Date() },
      })

      return NextResponse.json({ success: true, message: `Joined ${invite.team.name}` })
    } else if (action === "decline") {
      // Mark invite as declined
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { declined_at: new Date() },
      })

      return NextResponse.json({ success: true, message: "Invite declined" })
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'accept' or 'decline'" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Team invite action error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
