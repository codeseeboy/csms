"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { CscmsWorkerManagement } from "@/components/cscms-worker-management"

export default function WorkersPage() {
  return (
    <AuthGuard allowedRoles={["Contractor"]}>
      <DashboardLayout>
        <TopNavbar title="Worker Management" />
        <div className="space-y-4 overflow-x-auto p-4 sm:space-y-6 sm:p-6">
          <section aria-label="Worker Management">
            <CscmsWorkerManagement />
          </section>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
