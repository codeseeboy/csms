"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCscms } from "@/components/cscms-provider"
import {
  Bell,
  Mail,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Filter,
} from "lucide-react"
import { useState } from "react"

function channelConfig(channel: string) {
  if (channel === "email") return { icon: Mail, color: "#6366f1", bg: "bg-[#6366f1]/10", label: "Email" }
  if (channel === "sms") return { icon: MessageSquare, color: "#10b981", bg: "bg-[#10b981]/10", label: "SMS" }
  return { icon: Bell, color: "#FFC107", bg: "bg-[#FFC107]/10", label: "Alert" }
}

function priorityFromSubject(subject?: string) {
  if (!subject) return { color: "bg-muted text-muted-foreground border-border", label: "Info", icon: Info }
  const s = subject.toLowerCase()
  if (s.includes("violation") || s.includes("critical")) return { color: "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20", label: "Critical", icon: ShieldAlert }
  if (s.includes("alert") || s.includes("incident")) return { color: "bg-[#FF6F00]/10 text-[#FF6F00] border-[#FF6F00]/20", label: "Alert", icon: AlertTriangle }
  if (s.includes("completed") || s.includes("update")) return { color: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20", label: "Update", icon: CheckCircle2 }
  return { color: "bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/20", label: "Info", icon: Info }
}

export default function SafetyUpdatesPage() {
  const { notifications } = useCscms()
  const [filter, setFilter] = useState<"all" | "email" | "sms">("all")

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.channel === filter)

  const emailCount = notifications.filter((n) => n.channel === "email").length
  const smsCount = notifications.filter((n) => n.channel === "sms").length

  return (
    <AuthGuard allowedRoles={["Worker", "Admin", "Safety Inspector", "Contractor", "Government Authority"]}>
      <DashboardLayout>
        <TopNavbar title="Safety Updates" />
        <div className="space-y-6 p-6">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFC107]/10">
                  <Bell className="h-5 w-5 text-[#FFC107]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{notifications.length}</p>
                  <p className="text-xs text-muted-foreground">Total Alerts</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366f1]/10">
                  <Mail className="h-5 w-5 text-[#6366f1]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{emailCount}</p>
                  <p className="text-xs text-muted-foreground">Email Alerts</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">
                  <MessageSquare className="h-5 w-5 text-[#10b981]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{smsCount}</p>
                  <p className="text-xs text-muted-foreground">SMS Alerts</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(["all", "email", "sms"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {f === "all" ? "All" : f === "email" ? "Email" : "SMS"}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6F00]/10">
                <ShieldAlert className="h-4 w-4 text-[#FF6F00]" />
              </div>
              <CardTitle className="text-sm font-semibold">Safety Alerts & Notifications</CardTitle>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {filtered.length}
              </span>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-4 font-medium text-foreground">No safety alerts yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Notifications will appear here when incidents are reported or inspections are completed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.slice(0, 20).map((n) => {
                    const ch = channelConfig(n.channel)
                    const priority = priorityFromSubject(n.subject)
                    return (
                      <div key={n.id} className="group flex gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:border-border/60 hover:shadow-sm">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ch.bg}`}>
                          <ch.icon className="h-5 w-5" style={{ color: ch.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground text-sm">{n.subject ?? "Safety Notification"}</p>
                            <Badge variant="outline" className={`text-[10px] ${priority.color}`}>
                              <priority.icon className="mr-0.5 h-3 w-3" />
                              {priority.label}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(n.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-medium uppercase">{ch.label}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
