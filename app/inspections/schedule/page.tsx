"use client"

import { AuthGuard } from "@/components/auth-guard"

export default function InspectionSchedulePage() {
  return (
    <AuthGuard allowedRoles={["Admin", "Safety Inspector"]}>
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Inspection Scheduling</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use /inspections for full scheduling workflow.</p>
        </div>
      </div>
    </AuthGuard>
  )
}
