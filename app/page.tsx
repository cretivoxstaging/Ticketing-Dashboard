"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dashboard } from "@/components/dashboard"
import { TicketTable } from "@/components/ticket-table"
import { Sidebar } from "@/components/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/auth-provider"

export default function Page() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<"dashboard" | "tickets">("dashboard")

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />
      <main className="flex-1 overflow-auto">{activeTab === "dashboard" ? <Dashboard /> : <TicketTable />}</main>
    </div>
  )
}
