import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import SteamProvider from "@/lib/steam-provider"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    SteamProvider({
      clientId: "steam",
      clientSecret: process.env.STEAM_API_KEY!,
    }),
    
    // Development credentials provider for testing
    CredentialsProvider({
      name: "Test User",
      credentials: {
        userId: { label: "User ID", type: "text", placeholder: "1, 2, 3, etc." }
      },
      async authorize(credentials) {
        if (!credentials?.userId) return null
        
        const user = await prisma.user.findUnique({
          where: { id: parseInt(credentials.userId) }
        })
        
        if (user && user.enabled && !user.banned) {
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatar,
          }
        }
        return null
      }
    }),
    SteamProvider,
  ],
  callbacks: {
    async session({ session, user, token }) {
      let dbUser;
      
      if (user?.id) {
        // Database session
        dbUser = await prisma.user.findUnique({
          where: { id: parseInt(user.id) },
          include: {
            titles: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
            team_players: {
              include: {
                team: true,
              },
            },
          },
        })
      } else if (token?.sub) {
        // JWT session (credentials)
        dbUser = await prisma.user.findUnique({
          where: { id: parseInt(token.sub) },
          include: {
            titles: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
            team_players: {
              include: {
                team: true,
              },
            },
          },
        })
      }

      if (dbUser) {
        session.user = {
          ...session.user,
          id: dbUser.id.toString(),
          steamId: dbUser.steam_id,
          alias: dbUser.alias,
          admin: dbUser.admin,
          banned: dbUser.banned,
          enabled: dbUser.enabled,
          description: dbUser.description,
          steamProfile: dbUser.steam_profile,
          teams: dbUser.team_players.map(tp => tp.team),
        }
      }

      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "steam") {
        const steamId = user.id
        
        // Check if user exists
        let dbUser = await prisma.user.findUnique({
          where: { steam_id: steamId },
        })

        if (!dbUser) {
          // Create new user
          dbUser = await prisma.user.create({
            data: {
              steam_id: steamId,
              name: user.name || `Player_${steamId}`,
              email: user.email,
              avatar: user.image,
              steam_profile: `https://steamcommunity.com/profiles/${steamId}`,
              enabled: true,
              admin: false,
              banned: false,
            },
          })
        } else {
          // Update existing user info
          await prisma.user.update({
            where: { steam_id: steamId },
            data: {
              name: user.name || dbUser.name,
              avatar: user.image || dbUser.avatar,
              steam_profile: dbUser.steam_profile || `https://steamcommunity.com/profiles/${steamId}`,
            },
          })
        }

        // Check if user is banned
        if (dbUser.banned) {
          return false
        }

        return true
      }
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
}
