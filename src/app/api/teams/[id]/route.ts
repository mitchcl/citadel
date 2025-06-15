import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get specific team details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = parseInt(params.id)

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                steam_id: true,
                steam_profile: true,
              },
            },
          },
        },
        rosters: {
          include: {
            league: {
              include: {
                format: true,
              },
            },
            division: true,
          },
        },
        invites: {
          where: {
            accepted_at: null,
            declined_at: null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error("Get team error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Update team details
export async function PATCH(
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

    // Check if user is a member of the team
    const teamMember = await prisma.teamPlayer.findFirst({
      where: {
        team_id: teamId,
        user_id: parseInt(session.user.id!),
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: "You must be a team member to edit this team" },
        { status: 403 }
      )
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: body.name,
        tag: body.tag,
        description: body.description,
        notice: body.notice,
      },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                steam_id: true,
                steam_profile: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ team: updatedTeam })
  } catch (error) {
    console.error("Update team error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = parseInt(params.id)

    // Check if user is a member of the team
    const teamMember = await prisma.teamPlayer.findFirst({
      where: {
        team_id: teamId,
        user_id: parseInt(session.user.id!),
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: "You must be a team member to delete this team" },
        { status: 403 }
      )
    }

    // Check if team has any active rosters
    const activeRosters = await prisma.roster.findMany({
      where: {
        team_id: teamId,
        disbanded: false,
      },
    })

    if (activeRosters.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete team with active rosters" },
        { status: 400 }
      )
    }

    // Delete team and related data
    await prisma.$transaction([
      // Delete team players
      prisma.teamPlayer.deleteMany({
        where: { team_id: teamId },
      }),
      // Delete team invites
      prisma.teamInvite.deleteMany({
        where: { team_id: teamId },
      }),
      // Delete team transfers
      prisma.teamTransfer.deleteMany({
        where: { team_id: teamId },
      }),
      // Delete the team
      prisma.team.delete({
        where: { id: teamId },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete team error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
