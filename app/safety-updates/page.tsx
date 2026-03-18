"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCscms } from "@/components/cscms-provider"

export default function SafetyUpdatesPage() {
  const { notifications } = useCscms()

  return (
    <AuthGuard allowedRoles={["Worker", "Admin", "Safety Inspector", "Contractor"]}>
      <DashboardLayout>
        <TopNavbar title="Safety Updates" />
        <div className="space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Safety Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No safety alerts yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {n.subject ?? n.message}
                        </span>
                        <span className="text-xs text-muted-foreground">{n.channel.toUpperCase()}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {n.message}
                      </div>
                      <div className="mt-2 text-[10px] text-muted-foreground">
                        {new Date(n.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
