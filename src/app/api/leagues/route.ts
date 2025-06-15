import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get all leagues
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const format = searchParams.get('format')

    const where: any = {}
    
    if (status) {
      where.status = parseInt(status)
    }
    
    if (format) {
      where.format_id = parseInt(format)
    }

    const leagues = await prisma.league.findMany({
      where,
      include: {
        format: {
          include: {
            game: true,
          },
        },
        divisions: true,
        _count: {
          select: {
            rosters: true,
          },
        },
      },
      orderBy: [
        { status: 'desc' }, // Running leagues first
        { created_at: 'desc' },
      ],
    })

    return NextResponse.json({ leagues })
  } catch (error) {
    console.error("Get leagues error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Create new league (admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json()

    const league = await prisma.league.create({
      data: {
        format_id: body.format_id,
        name: body.name,
        description: body.description,
        category: body.category,
        status: body.status || 0,
        signuppable: body.signuppable ?? true,
        roster_locked: body.roster_locked ?? false,
        matches_submittable: body.matches_submittable ?? true,
        transfers_require_approval: body.transfers_require_approval ?? false,
        allow_set_ready: body.allow_set_ready ?? true,
        min_players: body.min_players || 6,
        max_players: body.max_players || 18,
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
    console.error("Create league error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
