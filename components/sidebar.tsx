"use client"

import { LayoutDashboard, LogOut, Table2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab: "dashboard" | "tickets"
  onTabChange: (tab: "dashboard" | "tickets") => void
  onLogout?: () => void
}

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  return (
    <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">Ticket System</h1>
      </div>
      <nav className="space-y-1 p-4">
        <button
          onClick={() => onTabChange("dashboard")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "dashboard"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </button>
        <button
          onClick={() => onTabChange("tickets")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "tickets"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Table2 className="h-5 w-5" />
          Tabel Tiket
        </button>
      </nav>
      {onLogout && (
        <div className="mt-auto border-t border-sidebar-border p-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border px-4 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      )}
    </aside>
  )
}
