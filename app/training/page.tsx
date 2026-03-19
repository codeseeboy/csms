"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCscms } from "@/components/cscms-provider"
import {
  Upload,
  Award,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Search,
} from "lucide-react"

function certBadge(status: string) {
  if (status === "Valid") return { class: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20", icon: CheckCircle2 }
  if (status === "Expiring") return { class: "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20", icon: AlertTriangle }
  return { class: "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20", icon: AlertTriangle }
}

function trainingBadge(status: string) {
  if (status === "Complete") return { class: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20", icon: CheckCircle2 }
  if (status === "In Progress") return { class: "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20", icon: Clock }
  return { class: "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20", icon: AlertTriangle }
}

export default function TrainingPage() {
  const { uploadTrainingFile, workers, currentUser } = useCscms()
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [selectedWorkerId, setSelectedWorkerId] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!selectedWorkerId && workers.length > 0) {
      setSelectedWorkerId(workers[0].id)
    }
  }, [selectedWorkerId, workers])

  const canUpload = currentUser?.role === "Admin" || currentUser?.role === "Contractor"

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase()) ||
      w.role.toLowerCase().includes(search.toLowerCase()),
  )

  const totalWorkers = workers.length
  const completeTraining = workers.filter((w) => w.trainingStatus === "Complete").length
  const expiringCerts = workers.filter((w) => w.certStatus === "Expiring").length
  const overdueTraining = workers.filter((w) => w.trainingStatus === "Overdue").length

  const handleUpload = async (file: File) => {
    if (!selectedWorkerId) return
    setIsUploading(true)
    setMessage(null)
    const result = await uploadTrainingFile(selectedWorkerId, file)
    setMessage(result.ok ? { text: "Training document uploaded successfully!", ok: true } : { text: result.message ?? "Upload failed", ok: false })
    setIsUploading(false)
  }

  return (
    <AuthGuard allowedRoles={["Worker", "Contractor", "Admin", "Safety Inspector"]}>
      <DashboardLayout>
        <TopNavbar title="Training & Certifications" />
        <div className="space-y-4 overflow-x-auto p-4 sm:space-y-6 sm:p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366f1]/10">
                  <Users className="h-5 w-5 text-[#6366f1]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{totalWorkers}</p>
                  <p className="text-xs text-muted-foreground">Total Workers</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">
                  <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{completeTraining}</p>
                  <p className="text-xs text-muted-foreground">Training Complete</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFC107]/10">
                  <AlertTriangle className="h-5 w-5 text-[#FFC107]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{expiringCerts}</p>
                  <p className="text-xs text-muted-foreground">Expiring Certs</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dc2626]/10">
                  <Clock className="h-5 w-5 text-[#dc2626]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{overdueTraining}</p>
                  <p className="text-xs text-muted-foreground">Overdue Training</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Section */}
          {canUpload && (
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFC107]/10">
                  <Upload className="h-4 w-4 text-[#FFC107]" />
                </div>
                <CardTitle className="text-sm font-semibold">Upload Training Document</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Select Worker</label>
                    <select
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]"
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                    >
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>{w.name} ({w.id})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Training File (PDF, JPG, PNG — max 5MB)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={isUploading}
                      className="h-10 w-full cursor-pointer rounded-lg border border-input bg-background px-3 text-sm file:mr-2 file:rounded file:border-0 file:bg-[#FFC107]/10 file:px-2 file:py-1 file:text-xs file:font-medium file:text-[#b08c00]"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(file)
                      }}
                    />
                  </div>
                </div>
                {message && (
                  <div className={`mt-3 rounded-lg border p-3 text-sm ${message.ok ? "border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981]" : "border-[#dc2626]/30 bg-[#dc2626]/5 text-[#dc2626]"}`}>
                    {message.text}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Per SRS: Worker is read-only here. Avoid showing admin upload restrictions to workers. */}
          {!canUpload && currentUser?.role !== "Worker" && (
            <div className="rounded-xl border border-[#FFC107]/20 bg-[#FFC107]/5 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#FFC107]" />
                <span className="font-medium text-foreground">Training uploads are restricted to Admin/Contractor.</span>
              </div>
              <p className="mt-1 text-xs">You can view training status and certification details for all workers below.</p>
            </div>
          )}

          {/* Worker Training Status Table */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2C3E50]/10">
                  <Award className="h-4 w-4 text-[#2C3E50]" />
                </div>
                <CardTitle className="truncate text-sm font-semibold">Worker Training & Certification Status</CardTitle>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search workers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107] sm:w-48"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Worker</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Certification</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Training</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">PPE</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredWorkers.map((worker) => {
                      const cert = certBadge(worker.certStatus)
                      const training = trainingBadge(worker.trainingStatus)
                      return (
                        <tr key={worker.id} className="transition-colors hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2C3E50] text-xs font-bold text-white">
                                {worker.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{worker.name}</p>
                                <p className="text-xs text-muted-foreground">{worker.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{worker.role}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${cert.class}`}>
                              <cert.icon className="mr-1 h-3 w-3" />
                              {worker.certStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${training.class}`}>
                              <training.icon className="mr-1 h-3 w-3" />
                              {worker.trainingStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{worker.assignedPPE || "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{worker.expiryDate || "—"}</td>
                        </tr>
                      )
                    })}
                    {filteredWorkers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No workers found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
