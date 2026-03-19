"use client"

import { useMemo, useState } from "react"
import { useCscms } from "@/components/cscms-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const { workers, currentUser, createWorker, updateWorker, deleteWorker } = useCscms()
  const [selectedId, setSelectedId] = useState<string>("WRK-004")
  const [message, setMessage] = useState<string | null>(null)

  const [workerModalOpen, setWorkerModalOpen] = useState(false)
  const [workerModalMode, setWorkerModalMode] = useState<"add" | "edit">("add")
  const [workerForm, setWorkerForm] = useState({
    name: "",
    role: "Crane Operator",
    contact: "",
    assignedPPE: "Helmet, Harness, Gloves",
    expiryDate: "",
  })
  const [workerFormMsg, setWorkerFormMsg] = useState<string | null>(null)

  const selected = useMemo(() => workers.find((worker) => worker.id === selectedId), [workers, selectedId])
  const expiringCount = workers.filter((worker) => worker.certStatus === "Expiring").length
  const noPpeCount = workers.filter((worker) => worker.assignedPPE === "None").length
  const overdueTraining = workers.filter((worker) => worker.trainingStatus === "Overdue").length

  const canManageWorkers = currentUser?.role === "Admin" || currentUser?.role === "Contractor"

  const openAddWorker = () => {
    setWorkerModalMode("add")
    setWorkerForm({
      name: "",
      role: "Crane Operator",
      contact: "",
      assignedPPE: "Helmet, Harness, Gloves",
      expiryDate: "",
    })
    setWorkerFormMsg(null)
    setWorkerModalOpen(true)
  }

  const openEditWorker = (workerId: string) => {
    const w = workers.find((x) => x.id === workerId)
    if (!w) return
    setSelectedId(workerId)
    setWorkerModalMode("edit")
    setWorkerForm({
      name: w.name,
      role: w.role,
      contact: w.contact,
      assignedPPE: w.assignedPPE,
      expiryDate: w.expiryDate ?? "",
    })
    setWorkerFormMsg(null)
    setWorkerModalOpen(true)
  }

  const submitWorkerForm = async () => {
    const trimmedName = workerForm.name.trim()
    if (!trimmedName || !workerForm.role || !workerForm.contact.trim() || !workerForm.assignedPPE || !workerForm.expiryDate) {
      setWorkerFormMsg("Please fill all required fields.")
      return
    }

    const payload = {
      name: trimmedName,
      role: workerForm.role,
      contact: workerForm.contact.trim(),
      assignedPPE: workerForm.assignedPPE,
      expiryDate: workerForm.expiryDate,
    }

    const result =
      workerModalMode === "add"
        ? await createWorker(payload)
        : await updateWorker(selectedId, payload)

    if (!result.ok) {
      setWorkerFormMsg(result.message ?? "Unable to save worker.")
      return
    }

    setWorkerModalOpen(false)
    setWorkerFormMsg(null)

    // If we edited the currently selected worker, refresh the selection details.
    setSelectedId((prev) => prev)
  }

  return (
    <div className="space-y-6">
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {canManageWorkers && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div />
          <Button className="bg-[#FFC107] text-[#1a1a2e] hover:bg-[#ffca2c]" onClick={openAddWorker}>
            Add Worker
          </Button>
        </div>
      )}

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
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelectedId(worker.id)}>
                      View
                    </Button>
                    {canManageWorkers && (
                      <>
                        <Button variant="outline" onClick={() => openEditWorker(worker.id)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="border-[#dc2626]/30 text-[#dc2626] hover:bg-[#dc2626]/10"
                          onClick={async () => {
                            const ok = window.confirm(`Delete worker ${worker.name}?`)
                            if (!ok) return
                            const result = await deleteWorker(worker.id)
                            if (!result.ok) setMessage(result.message ?? "Unable to delete worker")
                            if (selectedId === worker.id) setSelectedId("")
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
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
          </CardContent>
        </Card>
      )}

      <Dialog open={workerModalOpen} onOpenChange={setWorkerModalOpen}>
        <DialogContent className="border-border bg-card sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{workerModalMode === "add" ? "Add Worker" : "Edit Worker"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm text-card-foreground">Full Name</Label>
                <Input
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-card-foreground">Role</Label>
                <Select value={workerForm.role} onValueChange={(v) => setWorkerForm((prev) => ({ ...prev, role: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Crane Operator">Crane Operator</SelectItem>
                    <SelectItem value="Site Supervisor">Site Supervisor</SelectItem>
                    <SelectItem value="Electrician">Electrician</SelectItem>
                    <SelectItem value="Safety Inspector">Safety Inspector</SelectItem>
                    <SelectItem value="Welder">Welder</SelectItem>
                    <SelectItem value="Plumber">Plumber</SelectItem>
                    <SelectItem value="Scaffolder">Scaffolder</SelectItem>
                    <SelectItem value="Heavy Equipment Op.">Heavy Equipment Op.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm text-card-foreground">Contact Number</Label>
                <Input
                  value={workerForm.contact}
                  onChange={(e) => setWorkerForm((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder="+1 555-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-card-foreground">Certification Expiry</Label>
                <Input
                  type="date"
                  value={workerForm.expiryDate}
                  onChange={(e) => setWorkerForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-card-foreground">Assign PPE</Label>
              <Select
                value={workerForm.assignedPPE}
                onValueChange={(v) => setWorkerForm((prev) => ({ ...prev, assignedPPE: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select PPE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Helmet, Vest, Boots">Helmet, Vest, Boots</SelectItem>
                  <SelectItem value="Helmet, Harness, Gloves">Helmet, Harness, Gloves</SelectItem>
                  <SelectItem value="Helmet, Gloves, Goggles">Helmet, Gloves, Goggles</SelectItem>
                  <SelectItem value="Helmet, Welding Mask, Gloves">Helmet, Welding Mask, Gloves</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {workerFormMsg && (
              <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                {workerFormMsg}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="border-border text-foreground" onClick={() => setWorkerModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#FFC107] text-[#1a1a2e] hover:bg-[#ffca2c]"
              onClick={() => void submitWorkerForm()}
            >
              {workerModalMode === "add" ? "Add Worker" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
