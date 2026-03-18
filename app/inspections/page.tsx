"use client"

import { useMemo, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCscms } from "@/components/cscms-provider"

export default function InspectionsPage() {
  const { currentUser, inspections, scheduleInspection, completeInspection } = useCscms()

  const [site, setSite] = useState("Site A")
  const [inspectorEmail, setInspectorEmail] = useState("inspector@cscms.com")
  const [date, setDate] = useState("2026-03-10")
  const [type, setType] = useState("Fire Safety")
  const [formMsg, setFormMsg] = useState<string | null>(null)

  const [selectedInspectionId, setSelectedInspectionId] = useState<string>("")
  const [completeMsg, setCompleteMsg] = useState<string | null>(null)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)

  const checklistTemplate = [
    "Helmet",
    "Gloves",
    "Safety Vest",
    "Safety Boots",
    "Harness",
    "Goggles",
  ]

  const [checklistItems, setChecklistItems] = useState(
    checklistTemplate.map((label) => ({ label, compliant: true, notes: "" })),
  )

  const passed = checklistItems.filter((i) => i.compliant).length
  const failed = checklistItems.filter((i) => !i.compliant).length

  const myTasks = useMemo(() => {
    if (currentUser?.role !== "Safety Inspector") {
      return inspections
    }
    return inspections.filter((item) => item.inspectorEmail === currentUser.email)
  }, [inspections, currentUser])

  return (
    <AuthGuard allowedRoles={["Admin", "Safety Inspector"]}>
      <DashboardLayout>
        <TopNavbar title="Inspections" />
        <div className="space-y-6 p-6">
          {currentUser?.role === "Admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule New Inspection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={site} onChange={(e) => setSite(e.target.value)} />
                  <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={inspectorEmail} onChange={(e) => setInspectorEmail(e.target.value)} />
                  <input type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                  <input className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)} />
                </div>
                <Button
                  className="mt-3 bg-[#FFC107] text-[#1a1a2e] hover:bg-[#ffca2c]"
                  onClick={async () => {
                    const result = await scheduleInspection(site, inspectorEmail, date, type)
                    setFormMsg(result.ok ? "Inspection scheduled successfully." : result.message ?? "Unable to schedule")
                  }}
                >
                  Create Inspection
                </Button>
                {formMsg && <p className="mt-2 text-sm text-muted-foreground">{formMsg}</p>}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{currentUser?.role === "Safety Inspector" ? "My Tasks" : "Inspection Queue"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {myTasks.map((inspection) => (
                  <div key={inspection.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-semibold">{inspection.site} - {inspection.type}</p>
                      <p className="text-xs text-muted-foreground">{inspection.date} | {inspection.inspectorName} | {inspection.status}</p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedInspectionId(inspection.id)}>
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {currentUser?.role === "Safety Inspector" && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Inspection Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <input
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    placeholder="Inspection ID"
                    value={selectedInspectionId}
                    onChange={(e) => setSelectedInspectionId(e.target.value)}
                  />

                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <p className="font-semibold">PPE Checklist</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Auto-calculated: Passed {passed} | Violations {failed}
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {checklistItems.map((item, idx) => (
                        <div key={item.label} className="rounded-lg border border-border bg-card p-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={item.compliant}
                              onChange={(e) => {
                                const next = [...checklistItems]
                                next[idx] = { ...item, compliant: e.target.checked }
                                setChecklistItems(next)
                              }}
                            />
                            <span className="font-medium">{item.label}</span>
                          </label>
                          <input
                            className="mt-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                            placeholder={item.compliant ? "Optional notes" : "Violation notes (required if non-compliant)"}
                            value={item.notes}
                            disabled={item.compliant}
                            onChange={(e) => {
                              const next = [...checklistItems]
                              next[idx] = { ...item, notes: e.target.value }
                              setChecklistItems(next)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Mark unchecked items as violations. Backend persists checklist items for audit-ready reports.
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold">Inspection Evidence (optional)</p>
                    <input
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null
                        setEvidenceFile(f)
                      }}
                    />
                    {evidenceFile ? (
                      <p className="text-xs text-muted-foreground">
                        Selected: {evidenceFile.name}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No evidence attached.</p>
                    )}
                  </div>
                </div>

                <Button
                  className="mt-3 bg-[#2C3E50] text-white hover:bg-[#1f2e3d]"
                  onClick={async () => {
                    const result = await completeInspection(
                      selectedInspectionId,
                      passed,
                      failed,
                      checklistItems.map((i) => ({
                        label: i.label,
                        compliant: i.compliant,
                        notes: i.compliant ? "" : i.notes,
                      })),
                      evidenceFile ?? undefined,
                    )
                    setCompleteMsg(result.ok ? "Report submitted. Compliance record generated." : result.message ?? "Unable to complete")
                  }}
                >
                  Submit Inspection Report
                </Button>
                {completeMsg && <p className="mt-2 text-sm text-muted-foreground">{completeMsg}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
