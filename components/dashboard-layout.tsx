"use client"

import { SidebarProvider, useSidebar } from "@/components/sidebar-context"
import { AppSidebar } from "@/components/app-sidebar"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

function DashboardContent({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          isOpen ? "ml-64" : "ml-[68px]"
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
