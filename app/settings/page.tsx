"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { useCscms } from "@/components/cscms-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  Phone,
  Shield,
  LogOut,
  Bell,
  Clock,
  Activity,
  Key,
} from "lucide-react"

function roleBadge(role: string) {
  if (role === "Admin") return "bg-[#2C3E50]/10 text-[#2C3E50] border-[#2C3E50]/20"
  if (role === "Safety Inspector") return "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20"
  if (role === "Contractor") return "bg-[#FF6F00]/10 text-[#FF6F00] border-[#FF6F00]/20"
  if (role === "Worker") return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
  return "bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/20"
}

export default function SettingsPage() {
  const router = useRouter()
  const { currentUser, logout, notifications, auditLogs } = useCscms()

  const myLogs = auditLogs.filter((l) => l.userId === currentUser?.id).slice(0, 5)

  return (
    <AuthGuard>
      <DashboardLayout>
        <TopNavbar title="Settings" />
        <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
          {/* Profile Card */}
          <Card className="overflow-hidden border-border bg-card">
            <div className="h-24 bg-gradient-to-br from-[#1a2332] via-[#2C3E50] to-[#1a2332]" />
            <CardContent className="relative px-6 pb-6">
              <div className="-mt-12 flex items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-[#FFC107] to-[#FF6F00] text-2xl font-bold text-[#1a1a2e] shadow-lg">
                  {currentUser?.name?.split(" ").map((n) => n[0]).join("") ?? "?"}
                </div>
                <div className="pb-1">
                  <h2 className="text-xl font-bold text-foreground">{currentUser?.name ?? "Guest"}</h2>
                  <span className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadge(currentUser?.role ?? "")}`}>
                    {currentUser?.role ?? "No Session"}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">{currentUser?.email ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground">{currentUser?.phone || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notifications</p>
                    <p className="text-sm font-medium text-foreground">{notifications.length} received</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Account Security */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2C3E50]/10">
                  <Shield className="h-4 w-4 text-[#2C3E50]" />
                </div>
                <CardTitle className="text-sm font-semibold">Account & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Password</p>
                      <p className="text-xs text-muted-foreground">Managed via Admin panel</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Session Status</p>
                      <p className="text-xs text-[#10b981]">Active</p>
                    </div>
                  </div>
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                </div>

                <button
                  onClick={() => { logout(); router.push("/login") }}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#dc2626]/10 text-sm font-semibold text-[#dc2626] transition-all hover:bg-[#dc2626]/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </CardContent>
            </Card>

            {/* My Activity */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFC107]/10">
                  <Clock className="h-4 w-4 text-[#FFC107]" />
                </div>
                <CardTitle className="text-sm font-semibold">My Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {myLogs.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {myLogs.map((log) => (
                      <div key={log.id} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#FFC107]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground">{log.action.replace(/_/g, " ")}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{log.details}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground/60">
                            {new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
