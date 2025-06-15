import { OAuthConfig, OAuthUserConfig } from "next-auth/providers"

export interface SteamProfile extends Record<string, any> {
  steamid: string
  personaname: string
  profileurl: string
  avatar: string
  avatarmedium: string
  avatarfull: string
  realname?: string
  primaryclanid?: string
  timecreated?: number
  personastate: number
  personastateflags?: number
  loccountrycode?: string
  locstatecode?: string
  loccityid?: number
}

export default function SteamProvider<P extends SteamProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "steam",
    name: "Steam",
    type: "oauth",
    version: "2.0",
    
    // Steam uses OpenID 2.0, not OAuth 2.0
    authorization: {
      url: "https://steamcommunity.com/openid/login",
      params: {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`,
        "openid.realm": process.env.NEXTAUTH_URL,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
      },
    },
    
    token: {
      url: "https://steamcommunity.com/openid/login",
    },
    
    userinfo: {
      url: "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/",
      async request({ tokens, provider }) {
        // Extract Steam ID from the OpenID claimed_id
        const steamId = tokens.openid_claimed_id?.split("/").pop()
        
        if (!steamId) {
          throw new Error("No Steam ID found")
        }
        
        // Fetch user profile from Steam API
        const response = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
        )
        
        const data = await response.json()
        
        if (!data.response?.players?.[0]) {
          throw new Error("Failed to fetch Steam profile")
        }
        
        return data.response.players[0]
      },
    },
    
    profile(profile) {
      return {
        id: profile.steamid,
        name: profile.personaname,
        email: null, // Steam doesn't provide email
        image: profile.avatarfull,
        steamId: profile.steamid,
        steamProfile: profile.profileurl,
        avatar: profile.avatarfull,
        realName: profile.realname,
      }
    },
    
    style: {
      logo: "/steam-logo.svg",
      logoDark: "/steam-logo.svg",
      bg: "#000",
      text: "#fff",
      bgDark: "#000",
      textDark: "#fff",
    },
    
    options,
  }
}
