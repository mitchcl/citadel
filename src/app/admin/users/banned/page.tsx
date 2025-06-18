import { redirect } from "next/navigation"

export default function BannedUsersPage() {
  // Redirect to the main users page with banned filter
  redirect("/admin/users?status=banned")
}
