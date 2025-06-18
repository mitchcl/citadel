import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      steamId?: string | null
      alias?: string | null
      admin: boolean
      banned: boolean
      enabled: boolean
      description?: string | null
      steamProfile?: string | null
      teams?: Array<{
        id: number
        name: string
        tag?: string | null
        avatar?: string | null
        description?: string | null
        notice?: string | null
        created_at: Date
        updated_at: Date
      }>
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    steamId?: string | null
    alias?: string | null
    admin: boolean
    banned: boolean
    enabled: boolean
    description?: string | null
    steamProfile?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    steamId?: string | null
    alias?: string | null
    admin: boolean
    banned: boolean
    enabled: boolean
    description?: string | null
    steamProfile?: string | null
  }
}
