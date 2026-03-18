"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCscms } from "@/components/cscms-provider"
import {
  AlertTriangle,
  MapPin,
  Calendar,
  Upload,
  Send,
  FileText,
  Bell,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react"

function severityColor(s: string) {
  if (s === "Critical") return "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20"
  if (s === "High") return "bg-[#FF6F00]/10 text-[#FF6F00] border-[#FF6F00]/20"
  if (s === "Medium") return "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20"
  return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
}

function statusColor(s: string) {
  if (s === "Open") return "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20"
  if (s === "Under Review") return "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20"
  return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
}

export default function IncidentReportsPage() {
  const { incidents, submitIncident, notifications } = useCscms()

  const [title, setTitle] = useState("")
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openCount = incidents.filter((i) => i.status === "Open").length
  const reviewCount = incidents.filter((i) => i.status === "Under Review").length

  const onFileChange = (file: File | null) => {
    if (!file) { setEvidenceFile(null); return }
    if (file.size > 5 * 1024 * 1024) { setFeedback({ text: "File size exceeds 5 MB limit.", ok: false }); return }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) { setFeedback({ text: "Invalid file type. Only PDF, JPG, and PNG are allowed.", ok: false }); return }
    setEvidenceFile(file)
    setFeedback({ text: `Evidence attached: ${file.name}`, ok: true })
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title || !location || !description) { setFeedback({ text: "Please fill in all required fields.", ok: false }); return }
    setIsSubmitting(true)
    const result = await submitIncident({ title, severity, location, description, date, evidenceFile: evidenceFile ?? undefined })
    setFeedback(result.ok ? { text: "Incident reported successfully! Stakeholders have been notified.", ok: true } : { text: result.message ?? "Failed to submit.", ok: false })
    if (result.ok) { setTitle(""); setLocation(""); setDescription(""); setEvidenceFile(null) }
    setIsSubmitting(false)
  }

  return (
    <AuthGuard allowedRoles={["Admin", "Safety Inspector", "Contractor"]}>
      <DashboardLayout>
        <TopNavbar title="Incident Reports" />
        <div className="space-y-4 overflow-x-auto p-4 sm:space-y-6 sm:p-6">
          {/* Stats */}
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6F00]/10"><AlertTriangle className="h-5 w-5 text-[#FF6F00]" /></div><div><p className="text-xl font-bold">{incidents.length}</p><p className="text-xs text-muted-foreground">Total Incidents</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dc2626]/10"><ShieldAlert className="h-5 w-5 text-[#dc2626]" /></div><div><p className="text-xl font-bold">{openCount}</p><p className="text-xs text-muted-foreground">Open</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFC107]/10"><Clock className="h-5 w-5 text-[#FFC107]" /></div><div><p className="text-xl font-bold">{reviewCount}</p><p className="text-xs text-muted-foreground">Under Review</p></div></CardContent></Card>
          </div>

          {/* Report Form */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dc2626]/10"><AlertTriangle className="h-4 w-4 text-[#dc2626]" /></div>
              <CardTitle className="text-sm font-semibold">Report New Incident</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Incident Title *</label>
                    <input className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Fall from scaffold - Site A" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Severity *</label>
                    <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]" value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
                      <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Location *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Building A - Floor 3" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="date" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Description *</label>
                  <textarea className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of the incident..." />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Evidence (PDF, JPG, PNG — max 5MB)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40">
                      <Upload className="h-4 w-4" />
                      {evidenceFile ? evidenceFile.name : "Choose file"}
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                </div>

                {feedback && (
                  <div className={`rounded-lg border p-3 text-sm ${feedback.ok ? "border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981]" : "border-[#dc2626]/30 bg-[#dc2626]/5 text-[#dc2626]"}`}>
                    {feedback.text}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FFC107] text-sm font-bold text-[#1a1a2e] transition-all hover:bg-[#ffca2c] disabled:opacity-50">
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit Incident Report"}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Incidents */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6F00]/10"><FileText className="h-4 w-4 text-[#FF6F00]" /></div>
              <CardTitle className="text-sm font-semibold">Recent Incidents</CardTitle>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{incidents.length}</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {incidents.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No incidents reported yet.</p>}
                {incidents.slice(0, 8).map((inc) => (
                  <div key={inc.id} className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-3 transition-all hover:shadow-sm sm:gap-3">
                    <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                      <p className="truncate text-sm font-medium text-foreground">{inc.title || inc.id}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{inc.location}</span>
                        <span>&middot;</span> <span>{inc.date}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      <Badge variant="outline" className={`text-[10px] ${severityColor(inc.severity)}`}>{inc.severity}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusColor(inc.status)}`}>{inc.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Log */}
          {notifications.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/10"><Bell className="h-4 w-4 text-[#6366f1]" /></div>
                <CardTitle className="text-sm font-semibold">Notification Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.slice(0, 6).map((n) => (
                    <div key={n.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-xs">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-semibold uppercase text-muted-foreground">{n.channel}</span>
                      <span className="truncate text-muted-foreground">{n.subject ?? n.message}</span>
                      <span className="ml-auto shrink-0 text-muted-foreground/60">{new Date(n.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
