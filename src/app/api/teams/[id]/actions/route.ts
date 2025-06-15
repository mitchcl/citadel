import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Handle team invitations
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
    const { action, userId } = body

    // Get the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user is a member of the team
    const isTeamMember = team.players.some(
      (player) => player.user.id === parseInt(session.user.id!)
    )

    if (!isTeamMember) {
      return NextResponse.json(
        { error: "You must be a team member to perform this action" },
        { status: 403 }
      )
    }

    switch (action) {
      case "invite":
        if (!userId) {
          return NextResponse.json(
            { error: "User ID is required for invitations" },
            { status: 400 }
          )
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!targetUser) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Check if user is already on the team
        const existingPlayer = await prisma.teamPlayer.findFirst({
          where: {
            team_id: teamId,
            user_id: userId,
          },
        })

        if (existingPlayer) {
          return NextResponse.json(
            { error: "User is already on the team" },
            { status: 400 }
          )
        }

        // Check if there's already a pending invite
        const existingInvite = await prisma.teamInvite.findFirst({
          where: {
            team_id: teamId,
            user_id: userId,
            accepted_at: null,
            declined_at: null,
          },
        })

        if (existingInvite) {
          return NextResponse.json(
            { error: "User already has a pending invite" },
            { status: 400 }
          )
        }

        // Create the invite
        const invite = await prisma.teamInvite.create({
          data: {
            team_id: teamId,
            user_id: userId,
          },
          include: {
            user: true,
            team: true,
          },
        })

        return NextResponse.json({ invite })

      case "kick":
        if (!userId) {
          return NextResponse.json(
            { error: "User ID is required for kicking" },
            { status: 400 }
          )
        }

        // Find the team player
        const playerToKick = await prisma.teamPlayer.findFirst({
          where: {
            team_id: teamId,
            user_id: userId,
          },
        })

        if (!playerToKick) {
          return NextResponse.json(
            { error: "User is not on the team" },
            { status: 404 }
          )
        }

        // Remove from team
        await prisma.teamPlayer.delete({
          where: { id: playerToKick.id },
        })

        return NextResponse.json({ success: true })

      case "leave":
        // Find the current user's team player record
        const currentPlayerRecord = await prisma.teamPlayer.findFirst({
          where: {
            team_id: teamId,
            user_id: parseInt(session.user.id!),
          },
        })

        if (!currentPlayerRecord) {
          return NextResponse.json(
            { error: "You are not on this team" },
            { status: 404 }
          )
        }

        // Remove from team
        await prisma.teamPlayer.delete({
          where: { id: currentPlayerRecord.id },
        })

        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Team action error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
