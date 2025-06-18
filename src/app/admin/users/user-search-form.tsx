"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface UserSearchFormProps {
  initialQuery?: string
  initialStatus?: string
}

export function UserSearchForm({ initialQuery = "", initialStatus = "all" }: UserSearchFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [status, setStatus] = useState(initialStatus)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (status !== 'all') params.set('status', status)
    params.set('page', '1') // Reset to first page
    
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleClear = () => {
    setQuery("")
    setStatus("all")
    router.push('/admin/users')
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-4 items-end">
      <div className="flex-1">
        <Input
          placeholder="Search by name, email, alias, or Steam ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="w-40">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
      {(query || status !== "all") && (
        <Button type="button" variant="outline" onClick={handleClear}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </form>
  )
}
