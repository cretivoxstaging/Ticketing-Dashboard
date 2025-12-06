"use client"

import { useState } from "react"
import { LayoutDashboard, LogOut, Table2, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  activeTab: "dashboard" | "tickets"
  onTabChange: (tab: "dashboard" | "tickets") => void
  onLogout?: () => void
}

const SidebarContent = ({ activeTab, onTabChange, onLogout, onItemClick }: SidebarProps & { onItemClick?: () => void }) => {
  const handleTabChange = (tab: "dashboard" | "tickets") => {
    onTabChange(tab)
    onItemClick?.()
  }

  const handleLogout = () => {
    onLogout?.()
    onItemClick?.()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">Ticket System</h1>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <button
          onClick={() => handleTabChange("dashboard")}
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
          onClick={() => handleTabChange("tickets")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "tickets"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Table2 className="h-5 w-5" />
          Tickets Table
        </button>
      </nav>
      {onLogout && (
        <div className="shrink-0 border-t border-sidebar-border p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border px-4 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          <p className="text-xs text-center mt-3 text-sidebar-foreground">
            Powered by <span className="font-bold italic">CRETECH</span>
          </p>
        </div>
      )}
    </div>
  )
}

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <SidebarContent
              activeTab={activeTab}
              onTabChange={onTabChange}
              onLogout={onLogout}
              onItemClick={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <SidebarContent activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />
    </aside>
  )
}
