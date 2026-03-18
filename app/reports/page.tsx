"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCscms } from "@/components/cscms-provider"
import { Button } from "@/components/ui/button"

export default function ReportsPage() {
  const { complianceRecords, auditLogs, sessionToken } = useCscms()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"

  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")

  const downloadReport = async (format: "pdf" | "excel") => {
    if (!sessionToken) return
    const qs = new URLSearchParams()
    if (fromDate) qs.set("from", fromDate)
    if (toDate) qs.set("to", toDate)
    const query = qs.toString()
    const requestUrl = `${API_BASE_URL}/auth/reports/compliance/${format === "excel" ? "excel" : "pdf"}${query ? `?${query}` : ""}`
    const res = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    })
    if (!res.ok) return

    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = format === "pdf" ? "compliance-report.pdf" : "compliance-report.xlsx"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
  }

  return (
    <AuthGuard allowedRoles={["Admin", "Government Authority"]}>
      <DashboardLayout>
        <TopNavbar title="Compliance Reports" />
        <div className="space-y-4 overflow-x-auto p-4 sm:space-y-6 sm:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-xs text-muted-foreground">From</label>
                  <input
                    type="date"
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-xs text-muted-foreground">To</label>
                  <input
                    type="date"
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              <Button className="bg-[#2C3E50] text-white hover:bg-[#1f2e3d]" onClick={() => void downloadReport("pdf")}>
                Download PDF
              </Button>
              <Button className="bg-[#FFC107] text-[#1a1a2e] hover:bg-[#ffca2c]" onClick={() => void downloadReport("excel")}>
                Download Excel
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {complianceRecords.length === 0 && (
                  <p className="text-sm text-muted-foreground">No records generated yet.</p>
                )}
                {complianceRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-semibold">{record.site} - {record.inspectorName}</p>
                      <p className="text-xs text-muted-foreground">Score: {record.score}%</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Stored</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.slice(0, 12).map((log) => (
                  <div key={log.id} className="rounded-lg border border-border p-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{log.action}</span> | {log.module} | {log.userId}
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
