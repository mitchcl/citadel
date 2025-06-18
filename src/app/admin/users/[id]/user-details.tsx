"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Ban, 
  UserCheck, 
  Edit,
  MessageSquare,
  Plus,
  ArrowLeft
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface User {
  id: number
  name: string
  email: string | null
  alias: string | null
  avatar: string | null
  steam_id: string | null
  steam_profile: string | null
  description: string | null
  admin: boolean
  banned: boolean
  banned_until: string | null
  ban_reason: string | null
  enabled: boolean
  created_at: string
  updated_at: string
  admin_notes_about: Array<{
    id: number
    note: string
    created_at: string
    admin: {
      id: number
      name: string
    }
  }>
  ban_history: Array<{
    id: number
    ban_reason: string | null
    banned_at: string
    banned_until: string | null
    unbanned_at: string | null
    unban_reason: string | null
    is_active: boolean
    banned_by: {
      id: number
      name: string
    }
    unbanned_by: {
      id: number
      name: string
    } | null
  }>
  _count: {
    team_players: number
    roster_players: number
    forums_posts: number
  }
}

interface UserDetailsProps {
  user: User
}

export function UserDetails({ user: initialUser }: UserDetailsProps) {
  const { toast } = useToast()
  const [user, setUser] = useState(initialUser)
  const [isLoading, setIsLoading] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showUnbanDialog, setShowUnbanDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  
  // Ban form state
  const [banType, setBanType] = useState<"permanent" | "temporary" | "specific_date">("temporary")
  const [banLength, setBanLength] = useState("7")
  const [banUnit, setBanUnit] = useState("days")
  const [banReason, setBanReason] = useState("")
  const [banEndDate, setBanEndDate] = useState("")
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email || "",
    alias: user.alias || "",
    description: user.description || "",
    steam_profile: user.steam_profile || "",
  })
  
  // Note form state
  const [newNote, setNewNote] = useState("")
  
  // Unban form state
  const [unbanReason, setUnbanReason] = useState("")

  const isCurrentlyBanned = user.banned && (!user.banned_until || new Date(user.banned_until) > new Date())

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message,
        })
        // Refresh user data
        const userResponse = await fetch(`/api/admin/users/${user.id}`)
        if (userResponse.ok) {
          const updatedUser = await userResponse.json()
          setUser(updatedUser)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || `Failed to ${action} user.`,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBan = () => {
    let bannedUntil = null
    if (banType === "temporary") {
      const duration = parseInt(banLength)
      if (isNaN(duration) || duration <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid ban duration.",
          variant: "destructive",
        })
        return
      }
      
      const now = new Date()
      switch (banUnit) {
        case "hours":
          bannedUntil = new Date(now.getTime() + duration * 60 * 60 * 1000)
          break
        case "days":
          bannedUntil = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)
          break
        case "weeks":
          bannedUntil = new Date(now.getTime() + duration * 7 * 24 * 60 * 60 * 1000)
          break
        case "months":
          bannedUntil = new Date(now.getTime() + duration * 30 * 24 * 60 * 60 * 1000)
          break
      }
    } else if (banType === "specific_date") {
      if (!banEndDate) {
        toast({
          title: "Error",
          description: "Please select a ban end date.",
          variant: "destructive",
        })
        return
      }
      bannedUntil = new Date(banEndDate)
    }
    // For permanent bans, bannedUntil remains null

    handleAction("ban", {
      ban_reason: banReason,
      banned_until: bannedUntil?.toISOString(),
    })
    setShowBanDialog(false)
    setBanReason("")
    setBanLength("7")
    setBanUnit("days")
    setBanType("temporary")
    setBanEndDate("")
  }

  const handleUnban = () => {
    handleAction("unban", { unban_reason: unbanReason })
    setShowUnbanDialog(false)
    setUnbanReason("")
  }

  const handleEdit = () => {
    handleAction("update_details", editForm)
    setShowEditDialog(false)
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    
    handleAction("add_note", { note: newNote })
    setShowNoteDialog(false)
    setNewNote("")
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar || ""} alt={user.name} />
              <AvatarFallback className="text-lg">{user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {user.name}
                {user.admin && <Badge variant="destructive">Admin</Badge>}
                {isCurrentlyBanned && <Badge variant="destructive">Banned</Badge>}
                {!user.enabled && <Badge variant="secondary">Disabled</Badge>}
              </h1>
              {user.alias && <p className="text-muted-foreground">aka: {user.alias}</p>}
              {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Ban/Unban buttons */}
            {isCurrentlyBanned ? (
              <Button 
                variant="outline" 
                onClick={() => setShowUnbanDialog(true)}
                className="text-green-600 hover:text-green-700"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Unban User
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setShowBanDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </Button>
            )}
            
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit User Details</DialogTitle>
                  <DialogDescription>
                    Update user information and profile details.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="alias">Alias</Label>
                    <Input
                      id="alias"
                      value={editForm.alias}
                      onChange={(e) => setEditForm({ ...editForm, alias: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="steam_profile">Steam Profile URL</Label>
                    <Input
                      id="steam_profile"
                      value={editForm.steam_profile}
                      onChange={(e) => setEditForm({ ...editForm, steam_profile: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEdit} disabled={isLoading}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Steam ID</Label>
              <p className="font-mono text-sm">{user.steam_id || "Not connected"}</p>
            </div>
            
            {user.steam_profile && (
              <div>
                <Label className="text-sm text-muted-foreground">Steam Profile</Label>
                <a href={user.steam_profile} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline text-sm block">
                  {user.steam_profile}
                </a>
              </div>
            )}
            
            {user.description && (
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p className="text-sm">{user.description}</p>
              </div>
            )}
            
            <div>
              <Label className="text-sm text-muted-foreground">Member Since</Label>
              <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">Last Updated</Label>
              <p className="text-sm">{new Date(user.updated_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Ban Information */}
        {(user.banned || user.ban_reason) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                Ban Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <p className="text-sm">
                  {isCurrentlyBanned ? (
                    <Badge variant="destructive">Currently Banned</Badge>
                  ) : user.banned ? (
                    <Badge variant="secondary">Ban Expired</Badge>
                  ) : (
                    <Badge variant="default">Not Banned</Badge>
                  )}
                </p>
              </div>
              
              {user.banned_until && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {isCurrentlyBanned ? "Ban Expires" : "Ban Expired"}
                  </Label>
                  <p className="text-sm">{new Date(user.banned_until).toLocaleString()}</p>
                </div>
              )}
              
              {user.ban_reason && (
                <div>
                  <Label className="text-sm text-muted-foreground">Reason</Label>
                  <p className="text-sm">{user.ban_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Teams</span>
              <span className="text-sm font-medium">{user._count.team_players}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rosters</span>
              <span className="text-sm font-medium">{user._count.roster_players}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Forum Posts</span>
              <span className="text-sm font-medium">{user._count.forums_posts}</span>
            </div>
          </CardContent>
        </Card>

        {/* Admin Notes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Admin Notes
              </CardTitle>
              <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Admin Note</DialogTitle>
                    <DialogDescription>
                      Add a private note about this user. Only visible to admins.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="Enter your note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddNote} disabled={!newNote.trim() || isLoading}>
                      Add Note
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {user.admin_notes_about.length === 0 ? (
              <p className="text-muted-foreground text-sm">No admin notes yet.</p>
            ) : (
              <div className="space-y-4">
                {user.admin_notes_about.map((note) => (
                  <div key={note.id} className="border-l-2 border-muted pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{note.admin.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{note.note}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ban Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Configure the ban for {user.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Ban Type</Label>
              <Select value={banType} onValueChange={(value: "permanent" | "temporary" | "specific_date") => setBanType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary (Duration)</SelectItem>
                  <SelectItem value="specific_date">Until Specific Date</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {banType === "temporary" && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Duration</Label>
                  <Input
                    type="number"
                    value={banLength}
                    onChange={(e) => setBanLength(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="flex-1">
                  <Label>Unit</Label>
                  <Select value={banUnit} onValueChange={setBanUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {banType === "specific_date" && (
              <div>
                <Label>Ban Until Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={banEndDate}
                  onChange={(e) => setBanEndDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Select the exact date and time when the ban should expire
                </p>
              </div>
            )}
            
            <div>
              <Label>Reason (Public)</Label>
              <Textarea
                placeholder="Enter the reason for the ban..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBan} 
              className="bg-red-600 hover:bg-red-700"
              disabled={
                (banType === "temporary" && (!banLength || isNaN(parseInt(banLength)) || parseInt(banLength) <= 0)) ||
                (banType === "specific_date" && !banEndDate)
              }
            >
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unban Dialog */}
      <AlertDialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Unban User</AlertDialogTitle>
            <AlertDialogDescription>
              Remove the ban from {user.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Unban Reason (Optional)</Label>
              <Textarea
                placeholder="Enter the reason for removing the ban..."
                value={unbanReason}
                onChange={(e) => setUnbanReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnban} className="bg-green-600 hover:bg-green-700">
              Unban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
