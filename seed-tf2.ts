import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting TF2 seed...')

  // Create formats
  const sixes = await prisma.format.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '6v6',
      description: 'Standard 6v6 competitive format',
      player_count: 6,
      max_player_count: 12,
    },
  })

  const highlander = await prisma.format.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Highlander',
      description: '9v9 format with one of each class',
      player_count: 9,
      max_player_count: 18,
    },
  })

  // Create users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        steam_id: '76561198000000001',
        name: 'John Scout',
        email: 'john@example.com',
        alias: 'jscout',
        description: 'Fast scout main',
      },
    }),
    prisma.user.upsert({
      where: { id: 2 },
      update: {},
      create: {
        steam_id: '76561198000000002',
        name: 'Jane Soldier',
        email: 'jane@example.com',
        alias: 'jsoldier',
        description: 'Rocket jumping expert',
      },
    }),
    prisma.user.upsert({
      where: { id: 3 },
      update: {},
      create: {
        steam_id: '76561198000000003',
        name: 'Bob Demo',
        email: 'bob@example.com',
        alias: 'bdemo',
        description: 'Sticky spam master',
      },
    }),
    prisma.user.upsert({
      where: { id: 4 },
      update: {},
      create: {
        steam_id: '76561198000000004',
        name: 'Alice Medic',
        email: 'alice@example.com',
        alias: 'amedic',
        description: 'Healing machine',
      },
    }),
    prisma.user.upsert({
      where: { id: 5 },
      update: {},
      create: {
        steam_id: '76561198000000005',
        name: 'Admin User',
        email: 'admin@example.com',
        alias: 'admin',
        description: 'Site administrator',
        admin: true,
      },
    }),
  ])

  // Create teams
  const teams = await Promise.all([
    prisma.team.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Red Rockets',
        tag: 'RR',
        description: 'Fast-paced aggressive team',
      },
    }),
    prisma.team.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Blue Blazers',
        tag: 'BB',
        description: 'Defensive specialists',
      },
    }),
    prisma.team.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Green Giants',
        tag: 'GG',
        description: 'All-around solid team',
      },
    }),
  ])

  // Create team players
  await Promise.all([
    prisma.teamPlayer.upsert({
      where: { id: 1 },
      update: {},
      create: {
        user_id: users[0].id,
        team_id: teams[0].id,
      },
    }),
    prisma.teamPlayer.upsert({
      where: { id: 2 },
      update: {},
      create: {
        user_id: users[1].id,
        team_id: teams[0].id,
      },
    }),
    prisma.teamPlayer.upsert({
      where: { id: 3 },
      update: {},
      create: {
        user_id: users[2].id,
        team_id: teams[1].id,
      },
    }),
    prisma.teamPlayer.upsert({
      where: { id: 4 },
      update: {},
      create: {
        user_id: users[3].id,
        team_id: teams[1].id,
      },
    }),
  ])

  // Create leagues
  const leagues = await Promise.all([
    prisma.league.upsert({
      where: { id: 1 },
      update: {},
      create: {
        format_id: sixes.id,
        name: 'Spring 2025 6v6 League',
        description: 'Competitive 6v6 league for Spring 2025',
        category: 'Competitive',
        status: 1, // running
      },
    }),
    prisma.league.upsert({
      where: { id: 2 },
      update: {},
      create: {
        format_id: highlander.id,
        name: 'Summer 2025 Highlander League',
        description: 'Highlander format league for Summer 2025',
        category: 'Competitive',
        status: 0, // signups open
      },
    }),
  ])

  // Create divisions
  const divisions = await Promise.all([
    prisma.division.upsert({
      where: { id: 1 },
      update: {},
      create: {
        league_id: leagues[0].id,
        name: 'Open',
      },
    }),
    prisma.division.upsert({
      where: { id: 2 },
      update: {},
      create: {
        league_id: leagues[0].id,
        name: 'Intermediate',
      },
    }),
  ])

  // Create rosters
  const rosters = await Promise.all([
    prisma.roster.upsert({
      where: { id: 1 },
      update: {},
      create: {
        league_id: leagues[0].id,
        division_id: divisions[0].id,
        team_id: teams[0].id,
        name: 'Red Rockets Main',
        approved: true,
      },
    }),
    prisma.roster.upsert({
      where: { id: 2 },
      update: {},
      create: {
        league_id: leagues[0].id,
        division_id: divisions[0].id,
        team_id: teams[1].id,
        name: 'Blue Blazers Main',
        approved: true,
      },
    }),
  ])

  // Create roster players
  await Promise.all([
    prisma.rosterPlayer.upsert({
      where: { id: 1 },
      update: {},
      create: {
        roster_id: rosters[0].id,
        user_id: users[0].id,
      },
    }),
    prisma.rosterPlayer.upsert({
      where: { id: 2 },
      update: {},
      create: {
        roster_id: rosters[0].id,
        user_id: users[1].id,
      },
    }),
    prisma.rosterPlayer.upsert({
      where: { id: 3 },
      update: {},
      create: {
        roster_id: rosters[1].id,
        user_id: users[2].id,
      },
    }),
    prisma.rosterPlayer.upsert({
      where: { id: 4 },
      update: {},
      create: {
        roster_id: rosters[1].id,
        user_id: users[3].id,
      },
    }),
  ])

  // Create a sample match
  await prisma.match.upsert({
    where: { id: 1 },
    update: {},
    create: {
      division_id: divisions[0].id,
      home_roster_id: rosters[0].id,
      away_roster_id: rosters[1].id,
      round: 1,
      status: 0, // pending
    },
  })

  // Create user titles
  await prisma.userTitle.upsert({
    where: { id: 1 },
    update: {},
    create: {
      user_id: users[4].id,
      name: 'Site Administrator',
    },
  })

  // Create forum topics (hierarchical structure)
  // Create a special news topic
  const newsTopic = await prisma.forumsTopic.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'News & Announcements',
      description: 'Official news, announcements, and platform updates',
      created_by_id: users[4].id, // admin user
      pinned: true,
      hidden: false,
      depth: 0,
    },
  })

  const generalTopic = await prisma.forumsTopic.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'General Discussion',
      description: 'General community discussion and announcements',
      created_by_id: users[4].id, // admin user
      pinned: true,
      depth: 0,
    },
  })

  const competitiveTopic = await prisma.forumsTopic.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Competitive Discussion',
      description: 'Talk about competitive TF2, strategies, and matches',
      created_by_id: users[4].id,
      depth: 0,
    },
  })

  // Create a subtopic
  const strategiesTopic = await prisma.forumsTopic.upsert({
    where: { id: 4 },
    update: {},
    create: {
      parent_id: competitiveTopic.id,
      name: 'Strategies & Tactics',
      description: 'Discuss team strategies and class tactics',
      created_by_id: users[4].id,
      depth: 1,
    },
  })

  const leaguesTopic = await prisma.forumsTopic.upsert({
    where: { id: 5 },
    update: {},
    create: {
      name: 'Leagues & Events',
      description: 'League announcements and event discussions',
      created_by_id: users[4].id,
      depth: 0,
    },
  })

  // Create threads
  // News threads
  const newsThread1 = await prisma.forumsThread.upsert({
    where: { id: 1 },
    update: {},
    create: {
      topic_id: newsTopic.id,
      created_by_id: users[4].id,
      title: 'Welcome to the New Citadel Platform!',
      pinned: true,
      depth: 1,
    },
  })

  const newsThread2 = await prisma.forumsThread.upsert({
    where: { id: 2 },
    update: {},
    create: {
      topic_id: newsTopic.id,
      created_by_id: users[4].id,
      title: 'Season 2024 League Registrations Now Open',
      depth: 1,
    },
  })

  const newsThread3 = await prisma.forumsThread.upsert({
    where: { id: 3 },
    update: {},
    create: {
      topic_id: newsTopic.id,
      created_by_id: users[4].id,
      title: 'New Anti-Cheat Measures Implemented',
      depth: 1,
    },
  })

  const welcomeThread = await prisma.forumsThread.upsert({
    where: { id: 4 },
    update: {},
    create: {
      topic_id: generalTopic.id,
      created_by_id: users[4].id,
      title: 'Welcome to Citadel!',
      pinned: true,
      depth: 1,
    },
  })

  const strategyThread = await prisma.forumsThread.upsert({
    where: { id: 5 },
    update: {},
    create: {
      topic_id: strategiesTopic.id,
      created_by_id: users[0].id,
      title: 'Scout positioning on Process',
      depth: 2,
    },
  })

  const sixesThread = await prisma.forumsThread.upsert({
    where: { id: 6 },
    update: {},
    create: {
      topic_id: leaguesTopic.id,
      created_by_id: users[4].id,
      title: 'Season 32 6v6 Registration Open',
      pinned: true,
      depth: 1,
    },
  })

  // Create posts
  // News posts
  await prisma.forumsPost.upsert({
    where: { id: 1 },
    update: {},
    create: {
      thread_id: newsThread1.id,
      created_by_id: users[4].id,
      content: 'We\'re excited to announce the launch of the new Citadel platform! Built from the ground up with modern technology, this new system provides a better experience for competitive TF2 players.\n\n**What\'s New:**\n- Modern, responsive design\n- Improved team and league management\n- Enhanced forum system\n- Better match reporting\n- Real-time notifications\n\n**For Existing Users:**\nAll your data has been migrated from the old system. Please sign in with Steam to access your account.\n\n**Getting Started:**\n1. Sign in with your Steam account\n2. Join or create a team\n3. Register for active leagues\n4. Start competing!\n\nWelcome to the future of competitive TF2!',
    },
  })

  await prisma.forumsPost.upsert({
    where: { id: 2 },
    update: {},
    create: {
      thread_id: newsThread2.id,
      created_by_id: users[4].id,
      content: 'Registration for the 2024 competitive season is now open! We\'re running multiple leagues across different skill levels.\n\n**Available Leagues:**\n- Premier Division (Top level)\n- Intermediate Division\n- Open Division\n- Newbie Mix League (New players welcome!)\n\n**Format Details:**\n- 6v6 format\n- Weekly matches\n- Season runs for 8 weeks + playoffs\n- Map pool includes classic competitive maps\n\n**Registration Requirements:**\n- Team must have 6-12 players\n- All players must have Steam accounts\n- Team captain must confirm roster\n\n**Important Dates:**\n- Registration closes: January 31st\n- Season starts: February 7th\n- Playoffs: March 28th - April 4th\n\nDon\'t miss out - register your team today!',
    },
  })

  await prisma.forumsPost.upsert({
    where: { id: 3 },
    update: {},
    create: {
      thread_id: newsThread3.id,
      created_by_id: users[4].id,
      content: 'To maintain competitive integrity, we\'ve implemented new anti-cheat measures for all league matches.\n\n**New Requirements:**\n- All players must have SteamGuard enabled\n- Accounts must be at least 30 days old\n- VAC bans within 365 days result in league ban\n- Players may be randomly selected for demo reviews\n\n**Demo Recording:**\n- P-REC or similar recording software required\n- Demos must be kept for at least 4 weeks\n- Admins may request demos for review at any time\n\n**Reporting Suspicious Activity:**\nIf you suspect cheating, please:\n1. Record the incident\n2. Submit a report with evidence\n3. Include relevant demo files\n4. Provide timestamps\n\nThese measures help ensure fair play for everyone. Thank you for your cooperation!',
    },
  })

  await prisma.forumsPost.upsert({
    where: { id: 4 },
    update: {},
    create: {
      thread_id: welcomeThread.id,
      created_by_id: users[4].id,
      content: 'Welcome to the new Citadel website! This is a modern rebuild of our classic competitive TF2 platform. Feel free to explore the new features and let us know what you think.',
    },
  })

  await prisma.forumsPost.upsert({
    where: { id: 5 },
    update: {},
    create: {
      thread_id: strategyThread.id,
      created_by_id: users[0].id,
      content: "I've been experimenting with different scout positions on cp_process and wanted to share some findings. The key is understanding when to play passive vs aggressive based on your team's uber situation.\n\n**Passive positioning:**\n- Stay near health packs\n- Use cover effectively\n- Support your pocket soldier\n\n**Aggressive positioning:**\n- Push flanks when your team has uber advantage\n- Target enemy medic\n- Coordinate with your roamer",
    },
  })

  await prisma.forumsPost.upsert({
    where: { id: 6 },
    update: {},
    create: {
      thread_id: strategyThread.id,
      created_by_id: users[1].id,
      content: "Great points! I'd also add that communication with your pocket is crucial. Let them know when you're going for flanks so they can create space for you.",
    },
  })

  await prisma.forumsPost.upsert({
    where: { id: 4 },
    update: {},
    create: {
      thread_id: sixesThread.id,
      created_by_id: users[4].id,
      content: "Registration for Season 32 6v6 is now open! \n\n**Key Details:**\n- Registration deadline: February 15th\n- Season starts: March 1st\n- Format: Round robin + playoffs\n- Map pool: cp_process, cp_gullywash, cp_metalworks, cp_sunshine, cp_snakewater, cp_granary, koth_product\n\nGet your teams signed up early to secure your preferred division!",
    },
  })

  // Update thread post counts
  await prisma.forumsThread.update({
    where: { id: 1 },
    data: { posts_count: 1 },
  })

  await prisma.forumsThread.update({
    where: { id: 2 },
    data: { posts_count: 2 },
  })

  await prisma.forumsThread.update({
    where: { id: 3 },
    data: { posts_count: 1 },
  })

  console.log('TF2 seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
