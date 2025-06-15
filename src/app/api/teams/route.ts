import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const teamSchema = z.object({
  name: z.string().min(1).max(64),
  tag: z.string().max(8).optional(),
  description: z.string().max(1000).optional(),
  notice: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = teamSchema.parse(body)

    // Check if team name already exists
    const existingTeam = await prisma.team.findFirst({
      where: { name: validatedData.name }
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 400 }
      )
    }

    // Check if tag already exists (if provided)
    if (validatedData.tag) {
      const existingTag = await prisma.team.findFirst({
        where: { tag: validatedData.tag }
      })

      if (existingTag) {
        return NextResponse.json(
          { error: "A team with this tag already exists" },
          { status: 400 }
        )
      }
    }

    // Create the team and add the creator as the first player
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: validatedData.name,
          tag: validatedData.tag,
          description: validatedData.description,
          notice: validatedData.notice,
        },
      })

      // Add the creator as the first team member
      await tx.teamPlayer.create({
        data: {
          team_id: newTeam.id,
          user_id: parseInt(session.user.id),
        },
      })

      return newTeam
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const teams = await prisma.team.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { tag: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        players: {
          include: {
            user: true,
          },
          orderBy: {
            created_at: 'asc',
          },
        },
        _count: {
          select: {
            players: true,
            rosters: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
