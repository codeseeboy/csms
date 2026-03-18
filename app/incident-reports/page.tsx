"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCscms } from "@/components/cscms-provider"

export default function IncidentReportsPage() {
  const { incidents, submitIncident, notifications } = useCscms()

  const [title, setTitle] = useState("Fall from scaffold - Site A")
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High")
  const [location, setLocation] = useState("Building A - Floor 3")
  const [description, setDescription] = useState("Worker fell from 2nd level scaffolding")
  const [date, setDate] = useState("2026-03-06")
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [simulateServerDown, setSimulateServerDown] = useState(false)

  const onFileChange = (file: File | null) => {
    if (!file) {
      setEvidenceFile(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback("File size exceeds 5 MB limit. Please upload a smaller file.")
      return
    }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      setFeedback("Invalid file type. Only PDF, JPG, and PNG are allowed.")
      return
    }
    setEvidenceFile(file)
    setFeedback("Evidence ready. Submitting will upload it securely.")
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (simulateServerDown) {
      setFeedback("Unable to connect to server. Please try again later.")
      return
    }

    const result = await submitIncident({
      title,
      severity,
      location,
      description,
      date,
      evidenceFile: evidenceFile ?? undefined,
    })

    setFeedback(result.ok ? "Incident submitted successfully." : result.message ?? "Unable to connect to server. Please try again later.")
  }

  return (
    <AuthGuard allowedRoles={["Admin", "Safety Inspector", "Contractor"]}>
      <DashboardLayout>
        <TopNavbar title="Incident Reports" />
        <div className="space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Report New Incident</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onSubmit}>
                <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
                <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
                <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={location} onChange={(e) => setLocation(e.target.value)} />
                <input type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                <textarea className="md:col-span-2 min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
                <input type="file" className="md:col-span-2" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />

                <label className="md:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={simulateServerDown} onChange={(e) => setSimulateServerDown(e.target.checked)} />
                  Simulate API server timeout
                </label>

                {feedback && <p className="md:col-span-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">{feedback}</p>}

                <Button type="submit" className="md:col-span-2 w-full bg-[#FFC107] text-[#1a1a2e] hover:bg-[#ffca2c]">
                  Submit Report
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {incidents.slice(0, 6).map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-semibold">{incident.id} - {incident.title}</p>
                      <p className="text-xs text-muted-foreground">{incident.location}</p>
                    </div>
                    <Badge variant="outline">{incident.severity}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Log (Admin)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.slice(0, 6).map((notification) => (
                  <div key={notification.id} className="rounded-lg border border-border p-2 text-xs text-muted-foreground">
                    <span className="font-semibold uppercase text-foreground">{notification.channel}</span> to {notification.recipient}: {notification.subject ?? notification.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
