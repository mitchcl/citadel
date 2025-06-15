import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get specific league details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leagueId = parseInt(params.id)

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        format: {
          include: {
            game: true,
          },
        },
        divisions: {
          include: {
            rosters: {
              include: {
                team: true,
                _count: {
                  select: {
                    players: true,
                  },
                },
              },
            },
            matches: {
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
              },
              orderBy: {
                scheduled_at: 'asc',
              },
            },
          },
        },
        _count: {
          select: {
            rosters: true,
          },
        },
      },
    })

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 })
    }

    return NextResponse.json({ league })
  } catch (error) {
    console.error("Get league error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Update league (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id!) },
    })

    if (!user?.admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const leagueId = parseInt(params.id)
    const body = await request.json()

    const league = await prisma.league.update({
      where: { id: leagueId },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        status: body.status,
        signuppable: body.signuppable,
        roster_locked: body.roster_locked,
        matches_submittable: body.matches_submittable,
        transfers_require_approval: body.transfers_require_approval,
        allow_set_ready: body.allow_set_ready,
        min_players: body.min_players,
        max_players: body.max_players,
      },
      include: {
        format: {
          include: {
            game: true,
          },
        },
      },
    })

    return NextResponse.json({ league })
  } catch (error) {
    console.error("Update league error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
