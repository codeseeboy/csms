"use client"

import { AlertTriangle, Award, MapPin, Calendar, ChevronRight, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCscms } from "@/components/cscms-provider"
import Link from "next/link"

function severityConfig(value: string) {
  if (value === "Critical") return { color: "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20", dot: "bg-[#dc2626]", ring: "ring-[#dc2626]/20" }
  if (value === "High") return { color: "bg-[#FF6F00]/10 text-[#FF6F00] border-[#FF6F00]/20", dot: "bg-[#FF6F00]", ring: "ring-[#FF6F00]/20" }
  if (value === "Medium" || value === "Under Review") return { color: "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20", dot: "bg-[#FFC107]", ring: "ring-[#FFC107]/20" }
  return { color: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20", dot: "bg-[#10b981]", ring: "ring-[#10b981]/20" }
}

function statusConfig(value: string) {
  if (value === "Open") return { color: "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20" }
  if (value === "Under Review") return { color: "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20" }
  return { color: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20" }
}

export function CscmsDashboardPanels() {
  const { incidents, workers, auditLogs, inspections } = useCscms()

  const expiringWorkers = workers.filter((w) => w.certStatus === "Expiring").slice(0, 4)
  const upcomingInspections = inspections.filter((i) => i.status === "Scheduled").slice(0, 3)

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Recent Incidents */}
      <Card className="min-w-0 border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6F00]/10">
              <AlertTriangle className="h-4 w-4 text-[#FF6F00]" />
            </div>
            <CardTitle className="text-sm font-semibold text-card-foreground">Recent Incidents</CardTitle>
          </div>
          <Link href="/incident-reports" className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {incidents.slice(0, 5).map((incident) => {
              const sev = severityConfig(incident.severity)
              const stat = statusConfig(incident.status)
              return (
                <div
                  key={incident.id}
                  className="group flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-3 transition-all hover:border-border/60 hover:shadow-sm sm:flex-nowrap sm:gap-3"
                >
                  <div className={`relative h-2.5 w-2.5 shrink-0 rounded-full ${sev.dot}`}>
                    {incident.status === "Open" && (
                      <span className={`absolute inset-0 animate-ping rounded-full ${sev.dot} opacity-40`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <p className="truncate text-sm font-medium text-foreground">{incident.title ?? incident.id}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{incident.location}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className={`text-[10px] ${sev.color}`}>{incident.severity}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${stat.color}`}>{incident.status}</Badge>
                  </div>
                </div>
              )
            })}
            {incidents.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No incidents reported yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Inspections */}
      <div className="space-y-4">
        {/* Expiring Certs */}
        <Card className="min-w-0 border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dc2626]/10">
                <Award className="h-4 w-4 text-[#dc2626]" />
              </div>
              <CardTitle className="text-sm font-semibold text-card-foreground">Expiring Certifications</CardTitle>
            </div>
            {expiringWorkers.length > 0 && (
              <span className="rounded-full bg-[#dc2626]/10 px-2 py-0.5 text-[10px] font-semibold text-[#dc2626]">
                {expiringWorkers.length} alert{expiringWorkers.length !== 1 ? "s" : ""}
              </span>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringWorkers.map((worker) => (
                <div key={worker.id} className="flex items-center gap-3 rounded-xl border border-[#FFC107]/20 bg-[#FFC107]/5 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFC107]/20 text-xs font-bold text-[#b08c00]">
                    {worker.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{worker.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Expires {worker.expiryDate}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-[#FFC107]/30 bg-[#FFC107]/10 text-[10px] text-[#b08c00]">
                    Expiring
                  </Badge>
                </div>
              ))}
              {expiringWorkers.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#10b981]/30 bg-[#10b981]/5 p-4 text-center text-sm text-[#10b981]">
                  All certifications up to date
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Inspections */}
        <Card className="min-w-0 border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/10">
                <Shield className="h-4 w-4 text-[#6366f1]" />
              </div>
              <CardTitle className="text-sm font-semibold text-card-foreground">Upcoming Inspections</CardTitle>
            </div>
            <Link href="/inspections" className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingInspections.map((insp) => (
                <div key={insp.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-all hover:shadow-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10">
                    <Calendar className="h-4 w-4 text-[#6366f1]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{insp.site}</p>
                    <p className="text-xs text-muted-foreground">{insp.inspectorName} &middot; {insp.type}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {new Date(insp.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
              {upcomingInspections.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  No inspections scheduled
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
