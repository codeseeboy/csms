"use client"

import { useMemo, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { useCscms } from "@/components/cscms-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function certClass(status: string) {
  if (status === "Expired") return "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20"
  if (status === "Expiring") return "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20"
  return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
}

function daysToExpiry(dateStr: string) {
  const now = new Date()
  const expiry = new Date(dateStr)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function CscmsWorkerManagement() {
  const { workers, assignHighRiskTask } = useCscms()
  const [selectedId, setSelectedId] = useState<string>("WRK-004")
  const [showWarning, setShowWarning] = useState(false)
  const [note, setNote] = useState("Assignment acknowledged due to urgent timeline.")
  const [message, setMessage] = useState<string | null>(null)

  const selected = useMemo(() => workers.find((worker) => worker.id === selectedId), [workers, selectedId])
  const expiringCount = workers.filter((worker) => worker.certStatus === "Expiring").length
  const noPpeCount = workers.filter((worker) => worker.assignedPPE === "None").length
  const overdueTraining = workers.filter((worker) => worker.trainingStatus === "Overdue").length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-[#FFC107]/20 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Expiring Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#b08c00]">{expiringCount}</p>
          </CardContent>
        </Card>

        <Card className="border-[#FF6F00]/20 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Workers Without PPE</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#FF6F00]">{noPpeCount}</p>
          </CardContent>
        </Card>

        <Card className="border-[#dc2626]/20 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue Training</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#dc2626]">{overdueTraining}</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Worker ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Certification</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-mono text-xs">{worker.id}</TableCell>
                <TableCell>{worker.name}</TableCell>
                <TableCell>{worker.role}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={certClass(worker.certStatus)}>{worker.certStatus}</Badge>
                </TableCell>
                <TableCell>{worker.expiryDate}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" onClick={() => setSelectedId(worker.id)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Worker Details - {selected.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Worker ID: {selected.id}</p>
            <p className="text-sm text-muted-foreground">
              Certification: {selected.certStatus} {selected.certStatus === "Expiring" ? `(Expiring in ${daysToExpiry(selected.expiryDate)} days)` : ""}
            </p>

            <Button
              className="bg-[#2C3E50] text-white hover:bg-[#1f2e3d]"
              onClick={() => {
                if (selected.certStatus === "Expiring") {
                  setShowWarning(true)
                  return
                }
                const result = assignHighRiskTask(selected.id, "Scaffolding - Building A Floor 5", note)
                setMessage(result.ok ? "Assignment saved." : result.message ?? "Unable to assign")
              }}
            >
              Assign to High-Risk Task
            </Button>

            {showWarning && (
              <div className="space-y-2 rounded-lg border border-[#FFC107]/20 bg-[#FFC107]/10 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#b08c00]"><AlertTriangle className="h-4 w-4" />This worker's certification expires in 7 days. Proceed with acknowledgment?</p>
                <textarea className="min-h-16 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button
                  className="bg-[#FFC107] text-[#1a1a2e] hover:bg-[#ffca2c]"
                  onClick={() => {
                    const result = assignHighRiskTask(selected.id, "Scaffolding - Building A Floor 5", note)
                    setMessage(result.ok ? "Assignment saved with warningFlag = true." : result.message ?? "Unable to assign")
                    setShowWarning(false)
                  }}
                >
                  Proceed Anyway
                </Button>
              </div>
            )}

            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
