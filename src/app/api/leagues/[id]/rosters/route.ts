import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get league rosters
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leagueId = parseInt(params.id)

    const rosters = await prisma.roster.findMany({
      where: { league_id: leagueId },
      include: {
        team: true,
        division: true,
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
        _count: {
          select: {
            players: true,
          },
        },
      },
      orderBy: [
        { approved: 'desc' },
        { created_at: 'desc' },
      ],
    })

    return NextResponse.json({ rosters })
  } catch (error) {
    console.error("Get league rosters error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Create new roster for league
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leagueId = parseInt(params.id)
    const body = await request.json()

    // Check if league exists and is signuppable
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    })

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 })
    }

    if (!league.signuppable) {
      return NextResponse.json(
        { error: "League is not open for signups" },
        { status: 400 }
      )
    }

    // Check if team exists and user is a member
    const team = await prisma.team.findUnique({
      where: { id: body.team_id },
      include: {
        players: true,
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const isTeamMember = team.players.some(
      (player) => player.user_id === parseInt(session.user.id!)
    )

    if (!isTeamMember) {
      return NextResponse.json(
        { error: "You must be a member of the team to create a roster" },
        { status: 403 }
      )
    }

    // Check if team already has a roster in this league
    const existingRoster = await prisma.roster.findFirst({
      where: {
        league_id: leagueId,
        team_id: body.team_id,
      },
    })

    if (existingRoster) {
      return NextResponse.json(
        { error: "Team already has a roster in this league" },
        { status: 400 }
      )
    }

    // Create the roster
    const roster = await prisma.roster.create({
      data: {
        league_id: leagueId,
        team_id: body.team_id,
        name: body.name || team.name,
        description: body.description,
        notice: body.notice,
        approved: false, // Admin approval required
        disbanded: false,
      },
      include: {
        team: true,
        league: {
          include: {
            format: true,
          },
        },
      },
    })

    // Add team players to roster
    const rosterPlayers = team.players.map((player) => ({
      roster_id: roster.id,
      user_id: player.user_id,
    }))

    await prisma.rosterPlayer.createMany({
      data: rosterPlayers,
    })

    return NextResponse.json({ roster })
  } catch (error) {
    console.error("Create roster error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
