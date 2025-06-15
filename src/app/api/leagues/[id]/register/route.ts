import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteContext {
  params: { id: string }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const leagueId = parseInt(id)
    if (isNaN(leagueId)) {
      return NextResponse.json({ error: "Invalid league ID" }, { status: 400 })
    }

    const body = await request.json()
    const { team_id, roster_name, division_id, description, selected_players } = body

    // Validate required fields
    if (!team_id || !roster_name || !division_id || !Array.isArray(selected_players)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const teamId = parseInt(team_id)
    const divisionId = parseInt(division_id)

    if (isNaN(teamId) || isNaN(divisionId)) {
      return NextResponse.json({ error: "Invalid team or division ID" }, { status: 400 })
    }

    // Get league and verify it accepts registrations
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        divisions: {
          where: { id: divisionId }
        }
      }
    })

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 })
    }

    if (!league.signuppable) {
      return NextResponse.json({ error: "League registration is closed" }, { status: 400 })
    }

    if (league.divisions.length === 0) {
      return NextResponse.json({ error: "Invalid division" }, { status: 400 })
    }

    // Get team and verify user has permission
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        users: true,
        rosters: {
          where: {
            division: {
              league_id: leagueId
            }
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user has permission to register this team
    const userId = parseInt(session.user.id)
    const canRegister = team.captain_id === userId || 
                       team.users.some(user => user.id === userId)

    if (!canRegister) {
      return NextResponse.json({ error: "You don't have permission to register this team" }, { status: 403 })
    }

    // Check if team is already registered
    if (team.rosters.length > 0) {
      return NextResponse.json({ error: "Team is already registered for this league" }, { status: 400 })
    }

    // Validate selected players
    const validPlayerIds = team.users.map(user => user.id)
    const invalidPlayers = selected_players.filter((id: number) => !validPlayerIds.includes(id))
    
    if (invalidPlayers.length > 0) {
      return NextResponse.json({ error: "Some selected players are not on this team" }, { status: 400 })
    }

    // Check player count requirements
    if (selected_players.length < league.min_players) {
      return NextResponse.json({ 
        error: `Not enough players selected. Minimum: ${league.min_players}` 
      }, { status: 400 })
    }

    if (league.max_players > 0 && selected_players.length > league.max_players) {
      return NextResponse.json({ 
        error: `Too many players selected. Maximum: ${league.max_players}` 
      }, { status: 400 })
    }

    // Create the roster and players in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the roster
      const roster = await tx.roster.create({
        data: {
          name: roster_name,
          description: description || null,
          team_id: teamId,
          division_id: divisionId,
          approved: false, // Rosters need admin approval
          disbanded: false,
          points: 0,
          wonRounds: 0,
          lostRounds: 0,
          drawnRounds: 0,
          totalScores: 0,
          totalScoreDifference: 0,
          byeMatches: 0,
          placement: null,
          seeding: null,
          notice: null,
          ranking: null,
        }
      })

      // Add players to the roster
      for (const playerId of selected_players) {
        await tx.rosterPlayer.create({
          data: {
            roster_id: roster.id,
            user_id: playerId,
          }
        })
      }

      return roster
    })

    return NextResponse.json({ 
      success: true, 
      roster_id: result.id,
      message: "Team registered successfully! Your registration is pending admin approval." 
    })

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
