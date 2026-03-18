"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCscms } from "@/components/cscms-provider"

export default function TrainingPage() {
  const { uploadTrainingFile, workers, currentUser } = useCscms()
  const [message, setMessage] = useState<string | null>(null)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("")

  const workerOptions = workers.length > 0 ? workers : []

  // Default selection when workers load.
  useEffect(() => {
    if (!selectedWorkerId && workers.length > 0) {
      setSelectedWorkerId(workers[0].id)
    }
  }, [selectedWorkerId, workers])

  const canUpload = currentUser?.role === "Admin" || currentUser?.role === "Contractor"

  return (
    <AuthGuard allowedRoles={["Worker", "Contractor", "Admin", "Safety Inspector"]}>
      <DashboardLayout>
        <TopNavbar title="Training" />
        <div className="space-y-6 p-6">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Training uploads are restricted to Contractor/Admin. Workers can view training status here.
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload Training Document</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Worker</label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                >
                  {workerOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.id})
                    </option>
                  ))}
                </select>

                <input
                  type="file"
                  disabled={!canUpload}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file || !selectedWorkerId) return
                    const result = uploadTrainingFile(selectedWorkerId, file)
                    setMessage(result.ok ? "Training uploaded successfully." : result.message ?? "Upload failed")
                  }}
                />
              </div>
              {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
