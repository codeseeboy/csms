"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  AlertTriangle,
  HardHat,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/sidebar-context"
import { useCscms } from "@/components/cscms-provider"

const roleNavItems = {
  Admin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Reports", href: "/reports", icon: FileBarChart },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  "Safety Inspector": [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Inspections", href: "/inspections", icon: ClipboardCheck },
    { label: "Incidents", href: "/incident-reports", icon: AlertTriangle },
  ],
  Contractor: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Workers", href: "/workers", icon: Users },
    { label: "Incidents", href: "/incident-reports", icon: AlertTriangle },
  ],
  Worker: [
    { label: "Training", href: "/training", icon: ClipboardCheck },
    { label: "Safety Updates", href: "/safety-updates", icon: AlertTriangle },
  ],
  "Government Authority": [
    { label: "Reports", href: "/reports", icon: FileBarChart },
  ],
} as const

export function AppSidebar() {
  const pathname = usePathname()
  const { isOpen, isMobile, toggle, close } = useSidebar()
  const { currentUser } = useCscms()
  const navItems = currentUser ? roleNavItems[currentUser.role] : []

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-out",
          isMobile ? "w-72 shadow-xl" : isOpen ? "w-64" : "w-[68px]",
          isMobile && !isOpen && "-translate-x-full"
        )}
      >
        <div className="flex h-14 min-h-[3.5rem] items-center justify-between gap-2 border-b border-sidebar-border px-3 sm:h-16 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <HardHat className="h-5 w-5 text-primary-foreground" />
            </div>
            {isMobile || isOpen ? (
              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold tracking-wide text-sidebar-foreground">CSCMS</h1>
                <p className="truncate text-[10px] text-sidebar-foreground/50">Safety & Compliance</p>
              </div>
            ) : null}
          </div>
          {isMobile ? (
            <button
              onClick={close}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={toggle}
              className="hidden shrink-0 items-center justify-center rounded-lg p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:flex"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3 sm:px-3 sm:py-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={isMobile ? close : undefined}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {(isMobile || isOpen) && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {!isMobile && (
          <div className="border-t border-sidebar-border p-2">
            <button
              onClick={toggle}
              className="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
