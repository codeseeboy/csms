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
import Link from "next/link"

interface TopNavbarProps {
  title: string
}

export function TopNavbar({ title }: TopNavbarProps) {
  const router = useRouter()
  const { toggle } = useSidebar()
  const { currentUser, logout, notifications } = useCscms()

  return (
    <header className="sticky top-0 z-30 flex h-14 min-h-[3.5rem] min-w-0 shrink-0 items-center gap-2 overflow-hidden border-b border-border bg-card px-3 sm:h-16 sm:gap-4 sm:px-4 md:px-6">
      <button
        onClick={toggle}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h2 className="min-w-0 truncate text-base font-semibold text-foreground sm:text-lg">{title}</h2>

      <div className="ml-auto flex min-w-0 shrink items-center gap-1 sm:gap-2 md:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 min-w-0 rounded-lg border border-input bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary md:w-32 lg:w-44 xl:w-56"
          />
        </div>

        <Link
          href="/safety-updates"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 flex h-5 w-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-accent px-0 py-0 text-[10px] font-bold text-accent-foreground">
              {Math.min(notifications.length, 9)}
            </Badge>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted active:bg-muted sm:h-auto sm:gap-2 sm:rounded-lg sm:p-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden min-w-0 text-left sm:block lg:max-w-[100px] xl:max-w-[140px]">
                <p className="truncate text-sm font-medium text-foreground">{currentUser?.name ?? "Guest"}</p>
                <p className="truncate text-xs text-muted-foreground">{currentUser?.role ?? "No Session"}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
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
