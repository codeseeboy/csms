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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/sidebar-context"
import { useCscms } from "@/components/cscms-provider"

const roleNavItems = {
  Admin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Worker Management", href: "/workers", icon: Users },
    { label: "Inspections", href: "/inspections", icon: ClipboardCheck },
    { label: "Incident Reports", href: "/incident-reports", icon: AlertTriangle },
    { label: "PPE Management", href: "/workers", icon: HardHat },
    { label: "Reports", href: "/reports", icon: FileBarChart },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  "Safety Inspector": [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Inspections", href: "/inspections", icon: ClipboardCheck },
    { label: "Incident Reports", href: "/incident-reports", icon: AlertTriangle },
    { label: "Worker Management", href: "/workers", icon: Users },
  ],
  Contractor: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Worker Management", href: "/workers", icon: Users },
    { label: "Incident Reports", href: "/incident-reports", icon: AlertTriangle },
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
  const { isOpen, toggle } = useSidebar()
  const { currentUser } = useCscms()
  const navItems = currentUser ? roleNavItems[currentUser.role] : []

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isOpen ? "w-64" : "w-[68px]"
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <HardHat className="h-5 w-5 text-primary-foreground" />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <h1 className="truncate text-sm font-bold tracking-wide text-sidebar-foreground">
              CSCMS
            </h1>
            <p className="truncate text-[10px] text-sidebar-foreground/50">
              Safety & Compliance
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isOpen && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  )
}
