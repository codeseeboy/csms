"use client"

import { SidebarProvider, useSidebar } from "@/components/sidebar-context"
import { AppSidebar } from "@/components/app-sidebar"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

function DashboardContent({ children }: { children: ReactNode }) {
  const { isOpen, isMobile } = useSidebar()

  return (
    <div className="flex min-h-screen min-h-dvh bg-background">
      <AppSidebar />
      <main
        className={cn(
          "min-w-0 flex-1 transition-all duration-300",
          isMobile ? "" : isOpen ? "ml-64" : "ml-[68px]"
        )}
      >
        {children}
      </main>
    </div>
  )
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
