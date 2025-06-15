# Citadel Modern

A modern Next.js conversion of the Citadel league management system. This project is converting the Ruby on Rails Citadel application to a modern TypeScript/Next.js application with improved performance, scalability, and user experience.

## Project Status

This is an **in-progress conversion** from the original Ruby on Rails Citadel application. The following features have been implemented:

### ✅ Completed Features

- **Authentication System**: Steam OpenID authentication with NextAuth.js
- **Database Schema**: Complete Prisma schema matching the original Rails models
- **Core Pages**:
  - Home page with league and match listings
  - Teams listing and individual team pages
  - Team creation with form validation
  - Leagues listing page
  - User profile page with teams, rosters, and titles
  - Admin dashboard with statistics and management tools
- **Navigation**: Responsive navigation with user authentication states
- **UI Components**: Modern UI using Radix UI components and Tailwind CSS

### 🚧 In Progress / To Do

- **League Management**: Individual league pages, roster management, match scheduling
- **Team Management**: Team invitations, player management, roster transfers
- **Admin Interface**: Complete admin tools for managing games, formats, users
- **Forums System**: Discussion forums and topics
- **Match System**: Match reporting, score submission, dispute handling
- **File Uploads**: Avatar uploads for users and teams
- **Notifications**: Real-time notifications system
- **Search**: Advanced search functionality
- **Mobile Optimization**: Full responsive design
- **Performance**: Caching, database optimization

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Steam OpenID
- **UI**: Radix UI components + Tailwind CSS
- **Form Handling**: React Hook Form + Zod validation
- **Deployment**: Ready for Vercel/Docker deployment

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Steam API key (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd citadel-modern
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/citadel_modern"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
STEAM_API_KEY="your-steam-api-key"
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma db seed  # Optional: seed with sample data
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Migration

If you're migrating from the original Ruby on Rails Citadel:

1. Export your existing PostgreSQL data
2. Update the schema to match the new Prisma format
3. Run the migration scripts (to be provided)
4. Verify data integrity

## Architecture

```
src/
├── app/                 # Next.js App Router pages
│   ├── admin/          # Admin interface
│   ├── api/            # API routes
│   ├── leagues/        # League management
│   ├── teams/          # Team management
│   └── profile/        # User profiles
├── components/         # Reusable UI components
│   └── ui/            # Basic UI components
├── lib/               # Utility libraries
│   ├── auth.ts        # Authentication configuration
│   ├── prisma.ts      # Database client
│   └── utils.ts       # Helper functions
└── prisma/            # Database schema and migrations
```

## Key Differences from Rails Version

1. **Type Safety**: Full TypeScript implementation with strong typing
2. **Modern React**: Using React 19 with latest patterns and hooks
3. **Performance**: Server-side rendering, streaming, and optimized loading
4. **UI/UX**: Modern design system with consistent components
5. **API**: RESTful API routes with proper error handling
6. **Authentication**: Streamlined Steam authentication flow
7. **Database**: Prisma ORM for type-safe database operations

## Contributing

This conversion is ongoing. Priority areas for contribution:

1. **League Management**: Complete league roster and match management
2. **Forums System**: Implement discussion forums
3. **Admin Tools**: Expand administrative capabilities
4. **Testing**: Add comprehensive test coverage
5. **Documentation**: API documentation and user guides

## Deployment

The application is designed to be deployed on:

- **Vercel** (recommended for Next.js)
- **Docker** containers
- **Traditional VPS** with Node.js

## License

Same license as the original Citadel project.

## Original Project

This is a modernization of [ozfortress/citadel](https://github.com/ozfortress/citadel), an open-source league management system for competitive gaming.
