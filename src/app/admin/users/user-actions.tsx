"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { MoreHorizontal, Ban, UserCheck, Shield, ShieldOff, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: number
  name: string
  email: string | null
  admin: boolean
  banned: boolean
  enabled: boolean
}

interface UserActionsProps {
  user: User
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleAction = async (action: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${action} successfully.`,
        })
        router.refresh()
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
        description: `Network error occurred.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBan = () => {
    handleAction(user.banned ? 'unban' : 'ban')
    setShowBanDialog(false)
  }

  const handleToggleAdmin = () => {
    handleAction(user.admin ? 'remove_admin' : 'make_admin')
  }

  const handleToggleEnabled = () => {
    handleAction(user.enabled ? 'disable' : 'enable')
  }

  const handleDelete = () => {
    handleAction('delete')
    setShowDeleteDialog(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {user.banned ? (
            <DropdownMenuItem onClick={() => setShowBanDialog(true)}>
              <UserCheck className="h-4 w-4 mr-2" />
              Unban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setShowBanDialog(true)}>
              <Ban className="h-4 w-4 mr-2" />
              Ban User
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleToggleEnabled}>
            {user.enabled ? (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Disable Account
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Enable Account
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {user.admin ? (
            <DropdownMenuItem onClick={handleToggleAdmin}>
              <ShieldOff className="h-4 w-4 mr-2" />
              Remove Admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleToggleAdmin}>
              <Shield className="h-4 w-4 mr-2" />
              Make Admin
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Ban/Unban Confirmation Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.banned ? 'Unban User' : 'Ban User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.banned 
                ? `Are you sure you want to unban ${user.name}? They will be able to access the platform again.`
                : `Are you sure you want to ban ${user.name}? They will lose access to the platform.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBan}>
              {user.banned ? 'Unban' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {user.name}? This action cannot be undone.
              All user data, posts, and team memberships will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
