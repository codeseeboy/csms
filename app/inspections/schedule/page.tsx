"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"

export default function InspectionSchedulePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/inspections")
  }, [router])

  return (
    <AuthGuard allowedRoles={["Safety Inspector"]}>
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Inspection Scheduling</h1>
          <p className="mt-2 text-sm text-muted-foreground">Redirecting to the scheduling workflow...</p>
        </div>
      </div>
    </AuthGuard>
  )
}
