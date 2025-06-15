import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create games
  const tf2Game = await prisma.game.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Team Fortress 2',
    },
  })

  const csgoGame = await prisma.game.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Counter-Strike: Global Offensive',
    },
  })

  // Create formats
  const sixes = await prisma.format.upsert({
    where: { id: 1 },
    update: {},
    create: {
      game_id: tf2Game.id,
      name: '6v6',
      description: 'Competitive 6v6 format',
      player_count: 6,
      max_player_count: 12,
    },
  })

  const highlander = await prisma.format.upsert({
    where: { id: 2 },
    update: {},
    create: {
      game_id: tf2Game.id,
      name: 'Highlander',
      description: 'Competitive 9v9 format with one of each class',
      player_count: 9,
      max_player_count: 18,
    },
  })

  const csgo5v5 = await prisma.format.upsert({
    where: { id: 3 },
    update: {},
    create: {
      game_id: csgoGame.id,
      name: '5v5',
      description: 'Competitive 5v5 format',
      player_count: 5,
      max_player_count: 10,
    },
  })

  // Create leagues
  const summerSixes = await prisma.league.upsert({
    where: { id: 1 },
    update: {},
    create: {
      format_id: sixes.id,
      name: 'Summer 6v6 Season',
      description: 'Competitive 6v6 Team Fortress 2 league for summer 2025',
      category: 'Seasonal',
      status: 1, // running
      signuppable: true,
      roster_locked: false,
      matches_submittable: true,
      transfers_require_approval: false,
      allow_set_ready: true,
      min_players: 6,
      max_players: 12,
    },
  })

  const winterHighlander = await prisma.league.upsert({
    where: { id: 2 },
    update: {},
    create: {
      format_id: highlander.id,
      name: 'Winter Highlander Cup',
      description: 'Annual highlander tournament featuring the best 9v9 teams',
      category: 'Tournament',
      status: 1, // running
      signuppable: true,
      roster_locked: false,
      matches_submittable: true,
      transfers_require_approval: true,
      allow_set_ready: true,
      min_players: 9,
      max_players: 18,
    },
  })

  // Create divisions
  const div1 = await prisma.division.upsert({
    where: { id: 1 },
    update: {},
    create: {
      league_id: summerSixes.id,
      name: 'Premier Division',
    },
  })

  const div2 = await prisma.division.upsert({
    where: { id: 2 },
    update: {},
    create: {
      league_id: summerSixes.id,
      name: 'Intermediate Division',
    },
  })

  const hlDiv = await prisma.division.upsert({
    where: { id: 3 },
    update: {},
    create: {
      league_id: winterHighlander.id,
      name: 'Main Division',
    },
  })

  // Create some maps
  await prisma.map.createMany({
    data: [
      { name: 'cp_badlands' },
      { name: 'cp_granary' },
      { name: 'cp_gullywash' },
      { name: 'cp_metalworks' },
      { name: 'cp_process' },
      { name: 'cp_snakewater' },
      { name: 'koth_viaduct' },
      { name: 'de_dust2' },
      { name: 'de_inferno' },
      { name: 'de_mirage' },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seed data created successfully!')
  console.log('📊 Created:')
  console.log('  - 3 formats (6v6, Highlander, 5v5)')
  console.log('  - 3 leagues (2 active, 1 completed)')
  console.log('  - 3 divisions')
  console.log('  - 10 maps')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
