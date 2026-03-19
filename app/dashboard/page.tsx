"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { CscmsKpiCards } from "@/components/cscms-kpi-cards"
import { DashboardCharts } from "@/components/dashboard-charts"
import { CscmsDashboardPanels } from "@/components/cscms-dashboard-panels"
import { useCscms } from "@/components/cscms-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  ClipboardCheck,
  AlertTriangle,
  Users,
  FileBarChart,
  ArrowRight,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good Morning"
  if (h < 17) return "Good Afternoon"
  return "Good Evening"
}

function DashboardContent() {
  const { currentUser, openIncidents, activeInspections, workers, complianceRate, notifications, auditLogs } = useCscms()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isWorker = currentUser?.role === "Worker"
  const myWorker =
    isWorker && currentUser
      ? workers.find((w) => w.userId === currentUser.id) ?? (workers.length === 1 ? workers[0] : undefined)
      : undefined

  if (isWorker) {
    const safetyAlerts = notifications.filter((n) => n.subject !== "Certification expiry reminder").slice(0, 5)
    const expiryAlerts = notifications.filter((n) => n.subject === "Certification expiry reminder").slice(0, 3)

    return (
      <div className="min-w-0 space-y-4 p-4 sm:space-y-6 sm:p-6">
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2332] via-[#2C3E50] to-[#1a2332] p-4 sm:p-6 md:p-8 transition-all duration-700 ${mounted ? "animate-fade-in-up" : "opacity-0"}`}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #FFC107 0%, transparent 50%)" }} />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white/50">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <h1 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">
                {getGreeting()}, {currentUser?.name?.split(" ")[0] ?? "there"}
              </h1>
              <p className="mt-2 line-clamp-2 text-sm text-white/60">
                Work status and safety alerts for your site.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {myWorker ? (
                <>
                  <Badge variant="outline" className="border-[#FFC107]/30 bg-[#FFC107]/5 text-[#b08c00] text-[10px]">
                    {myWorker.certStatus}
                  </Badge>
                  <Badge variant="outline" className="border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981] text-[10px]">
                    {myWorker.trainingStatus}
                  </Badge>
                </>
              ) : (
                <Badge variant="outline" className="border-border bg-background text-muted-foreground text-[10px]">
                  No worker profile
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 pb-2">
                <AlertTriangle className="h-4 w-4 text-[#FF6F00]" />
                <h3 className="text-sm font-semibold">Safety Alerts</h3>
                <span className="ml-auto text-xs text-muted-foreground">{safetyAlerts.length}</span>
              </div>
              {safetyAlerts.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No safety alerts right now.</p>
              ) : (
                <div className="space-y-2">
                  {safetyAlerts.map((n) => (
                    <div key={n.id} className="rounded-lg border border-border bg-background p-3 text-xs">
                      <p className="font-semibold text-foreground">{n.subject ?? "Safety Alert"}</p>
                      <p className="mt-1 text-muted-foreground leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <Link href="/safety-updates" className="text-xs font-semibold text-[#FFC107] hover:underline">
                  View all safety updates
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 pb-2">
                <Users className="h-4 w-4 text-[#2C3E50]" />
                <h3 className="text-sm font-semibold">Work Status</h3>
              </div>
              {myWorker ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">{myWorker.name}</p>
                    <p className="text-xs text-muted-foreground">{myWorker.id}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Certification</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{myWorker.certStatus}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Expiry: {myWorker.expiryDate || "—"}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Training</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{myWorker.trainingStatus}</p>
                      <p className="mt-1 text-xs text-muted-foreground">PPE: {myWorker.assignedPPE || "—"}</p>
                    </div>
                  </div>

                  {expiryAlerts.length > 0 && (
                    <div className="rounded-lg border border-[#FFC107]/30 bg-[#FFC107]/5 p-3">
                      <p className="text-xs font-semibold text-[#b08c00]">Training Alert</p>
                      <div className="mt-2 space-y-2">
                        {expiryAlerts.map((n) => (
                          <div key={n.id} className="text-xs text-muted-foreground">
                            {n.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Link href="/training" className="text-xs font-semibold text-[#FFC107] hover:underline">
                      Go to training status
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">Your worker profile is not set. Contact your contractor/admin.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const quickActions = [
    { label: "Schedule Inspection", href: "/inspections", icon: ClipboardCheck, color: "#FFC107", bg: "bg-[#FFC107]/10" },
    { label: "Report Incident", href: "/incident-reports", icon: AlertTriangle, color: "#FF6F00", bg: "bg-[#FF6F00]/10" },
    { label: "Manage Workers", href: "/workers", icon: Users, color: "#2C3E50", bg: "bg-[#2C3E50]/10" },
    { label: "View Reports", href: "/reports", icon: FileBarChart, color: "#6366f1", bg: "bg-[#6366f1]/10" },
  ]

  const recentActivity = auditLogs.slice(0, 5)

  return (
    <div className="min-w-0 space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Welcome Banner */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2332] via-[#2C3E50] to-[#1a2332] p-4 sm:p-6 md:p-8 transition-all duration-700 ${mounted ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #FFC107 0%, transparent 50%)" }} />
        <div className="relative flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white/50">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            <h1 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl md:text-3xl">
              {getGreeting()}, {currentUser?.name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="mt-2 line-clamp-2 text-sm text-white/60">
              {openIncidents > 0
                ? `You have ${openIncidents} open incident${openIncidents !== 1 ? "s" : ""} and ${activeInspections} scheduled inspection${activeInspections !== 1 ? "s" : ""} to review.`
                : `All clear — ${activeInspections} inspection${activeInspections !== 1 ? "s" : ""} scheduled. Compliance at ${complianceRate}%.`
              }
            </p>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-[#10b981]" />
              </div>
              <p className="mt-2 text-lg font-bold text-white">{complianceRate}%</p>
              <p className="text-xs text-white/50">Compliance</p>
            </div>
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Activity className="h-6 w-6 text-[#FFC107]" />
              </div>
              <p className="mt-2 text-lg font-bold text-white">{workers.length}</p>
              <p className="text-xs text-white/50">Workers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 transition-all duration-700 ${mounted ? "animate-fade-in-up delay-200" : "opacity-0"}`}>
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="hover-lift group cursor-pointer border-border bg-card transition-all hover:border-[#FFC107]/30 hover:shadow-lg hover:shadow-[#FFC107]/5">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.bg} transition-transform group-hover:scale-110`}>
                  <action.icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{action.label}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <section className={`transition-all duration-700 ${mounted ? "animate-fade-in-up delay-300" : "opacity-0"}`} aria-label="Key Performance Indicators">
        <CscmsKpiCards />
      </section>

      {/* Charts */}
      <section className={`transition-all duration-700 ${mounted ? "animate-fade-in-up delay-400" : "opacity-0"}`} aria-label="Analytics Charts">
        <DashboardCharts />
      </section>

      {/* Panels + Activity Timeline */}
      <div className={`grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 transition-all duration-700 ${mounted ? "animate-fade-in-up delay-500" : "opacity-0"}`}>
        <div className="xl:col-span-2">
          <CscmsDashboardPanels />
        </div>

        {/* Activity Timeline */}
        <Card className="border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border p-5">
            <Clock className="h-5 w-5 text-[#FFC107]" />
            <h3 className="text-sm font-semibold text-card-foreground">Recent Activity</h3>
            <span className="ml-auto rounded-full bg-[#FFC107]/10 px-2 py-0.5 text-xs font-medium text-[#FFC107]">
              {recentActivity.length}
            </span>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.length === 0 && (
                <div className="p-5 text-center text-sm text-muted-foreground">No recent activity</div>
              )}
              {recentActivity.map((log, i) => (
                <div key={log.id} className="flex gap-3 p-4 transition-colors hover:bg-muted/30">
                  <div className="relative flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-[#FFC107]" : "bg-muted-foreground/30"}`} />
                    {i < recentActivity.length - 1 && (
                      <div className="mt-1 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <p className="text-xs font-semibold text-foreground">{log.action.replace(/_/g, " ")}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{log.details}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      {new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Banner */}
      {notifications.length > 0 && (
        <div className={`rounded-xl border border-[#FFC107]/20 bg-[#FFC107]/5 p-4 transition-all duration-700 ${mounted ? "animate-fade-in-up delay-600" : "opacity-0"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFC107]/15">
                <Activity className="h-4 w-4 text-[#FFC107]" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {notifications.length} notification{notifications.length !== 1 ? "s" : ""} pending
                </p>
                <p className="text-xs text-muted-foreground">{notifications[0]?.subject ?? ""}</p>
              </div>
            </div>
            <Link href="/safety-updates" className="flex items-center gap-1 text-xs font-semibold text-[#FFC107] hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <TopNavbar title="Dashboard" />
        <DashboardContent />
      </DashboardLayout>
    </AuthGuard>
  )
}
