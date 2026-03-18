"use client"

import { useRouter } from "next/navigation"
import { Bell, Search, Menu, User } from "lucide-react"
import { useSidebar } from "@/components/sidebar-context"
import { useCscms } from "@/components/cscms-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface TopNavbarProps {
  title: string
}

export function TopNavbar({ title }: TopNavbarProps) {
  const router = useRouter()
  const { toggle } = useSidebar()
  const { currentUser, logout, notifications } = useCscms()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-6">
      <button
        onClick={toggle}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h2 className="text-lg font-semibold text-foreground">{title}</h2>

      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-accent p-0 text-[10px] font-bold text-accent-foreground">
            {Math.min(notifications.length, 9)}
          </Badge>
        </button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-foreground">{currentUser?.name ?? "Guest"}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.role ?? "No Session"}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout()
                router.push("/login")
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
