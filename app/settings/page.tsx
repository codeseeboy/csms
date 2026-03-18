"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { useCscms } from "@/components/cscms-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const { currentUser, logout, notifications } = useCscms()

  return (
    <AuthGuard>
      <DashboardLayout>
        <TopNavbar title="Settings" />
        <div className="space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Name: </span>
                {currentUser?.name ?? "—"}
              </div>
              <div>
                <span className="font-semibold">Email: </span>
                {currentUser?.email ?? "—"}
              </div>
              <div>
                <span className="font-semibold">Role: </span>
                {currentUser?.role ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                Notifications received: {notifications.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                className="bg-[#2C3E50] text-white hover:bg-[#1f2e3d]"
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
              >
                Log out
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
