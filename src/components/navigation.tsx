"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { 
  Trophy, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  BookOpen, 
  HelpCircle, 
  ExternalLink,
  Shield,
  UserCheck,
  FileText,
  Monitor
} from "lucide-react"

export function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Trophy className="h-6 w-6" />
            <span className="font-bold">Citadel</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Home
            </Link>
            <Link
              href="/users"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Users
            </Link>
            <Link
              href="/teams"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Teams
            </Link>
            <Link
              href="/forums"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Forums
            </Link>
            <Link
              href="/leagues"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Leagues
            </Link>
            
            {/* Rules Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-sm font-medium text-foreground/60 hover:text-foreground/80">
                  Rules
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white border border-gray-200 shadow-lg z-50">
                <DropdownMenuLabel>Competitive Rulesets</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/rules/global" target="_blank" rel="noopener">
                    <FileText className="mr-2 h-4 w-4" />
                    Global Ruleset
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/rules/sixes" target="_blank" rel="noopener">
                    <FileText className="mr-2 h-4 w-4" />
                    Sixes Ruleset
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/rules/highlander" target="_blank" rel="noopener">
                    <FileText className="mr-2 h-4 w-4" />
                    Highlander Ruleset
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/rules/lan/index" target="_blank" rel="noopener">
                    <FileText className="mr-2 h-4 w-4" />
                    LAN Ruleset
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Behaviour</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/rules/community_guidelines" target="_blank" rel="noopener">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Community Guidelines
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/rules/infractions" target="_blank" rel="noopener">
                    <Shield className="mr-2 h-4 w-4" />
                    Player Behaviour Infractions
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/rules/penalties" target="_blank" rel="noopener">
                    <Shield className="mr-2 h-4 w-4" />
                    League Penalties
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-sm font-medium text-foreground/60 hover:text-foreground/80">
                  Help
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white border border-gray-200 shadow-lg z-50">
                <DropdownMenuLabel>General Info</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/info/staff" target="_blank" rel="noopener">
                    <Users className="mr-2 h-4 w-4" />
                    Staff
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/guides/pov_demo_recording/" target="_blank" rel="noopener">
                    <FileText className="mr-2 h-4 w-4" />
                    POV Demo Recording
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/info/anticheat_and_you" target="_blank" rel="noopener">
                    <Shield className="mr-2 h-4 w-4" />
                    Anti-Cheat and You
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://forms.gle/WmkpBvb4AFEc1cxaA" target="_blank" rel="noopener">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Ban Appeals
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Guides</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/guides/book_a_server" target="_blank" rel="noopener">
                    <Monitor className="mr-2 h-4 w-4" />
                    Book a Server
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/guides/newbie_guide" target="_blank" rel="noopener">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Newbie Guide
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Other</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="https://verify.ozfortress.com" target="_blank" rel="noopener">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Verify Rosters tool
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="https://docs.ozfortress.com/support/landing/" target="_blank" rel="noopener">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Support & Reporting
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="https://au.serveme.tf"
              target="_blank"
              rel="noopener"
              className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1"
            >
              Server Booking
              <ExternalLink className="h-3 w-3" />
            </Link>
            
            <Link
              href="https://docs.ozfortress.com"
              target="_blank"
              rel="noopener"
              className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-1"
            >
              Docs
              <ExternalLink className="h-3 w-3" />
            </Link>
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Admin link for admin users */}
          {session?.user?.admin && (
            <Link
              href="/admin"
              className="transition-colors hover:text-foreground/80 text-foreground/60 text-sm font-medium"
            >
              Admin
            </Link>
          )}
          
          {status === "loading" ? (
            <div>Loading...</div>
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                    <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg z-50" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{session.user?.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <Users className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-teams">
                    <Users className="mr-2 h-4 w-4" />
                    My Teams
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(event) => {
                    event.preventDefault()
                    signOut()
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => signIn()}>Sign In</Button>
          )}
        </div>
      </div>
    </nav>
  )
}
