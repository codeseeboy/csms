"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"

interface Worker {
  id: string
  name: string
  role: string
  contact: string
  certStatus: "Valid" | "Expiring" | "Expired"
  trainingStatus: "Complete" | "In Progress" | "Overdue"
  assignedPPE: string
  expiryDate: string
}

const workersData: Worker[] = [
  {
    id: "WRK-001",
    name: "James Rodriguez",
    role: "Crane Operator",
    contact: "+1 555-0101",
    certStatus: "Valid",
    trainingStatus: "Complete",
    assignedPPE: "Helmet, Harness, Gloves",
    expiryDate: "2026-08-15",
  },
  {
    id: "WRK-002",
    name: "Sarah Chen",
    role: "Site Supervisor",
    contact: "+1 555-0102",
    certStatus: "Expiring",
    trainingStatus: "Complete",
    assignedPPE: "Helmet, Vest, Boots",
    expiryDate: "2026-03-20",
  },
  {
    id: "WRK-003",
    name: "Mike Thompson",
    role: "Electrician",
    contact: "+1 555-0103",
    certStatus: "Valid",
    trainingStatus: "In Progress",
    assignedPPE: "Helmet, Gloves, Goggles",
    expiryDate: "2026-11-30",
  },
  {
    id: "WRK-004",
    name: "Ana Petrova",
    role: "Safety Inspector",
    contact: "+1 555-0104",
    certStatus: "Expired",
    trainingStatus: "Overdue",
    assignedPPE: "Helmet, Vest",
    expiryDate: "2025-12-01",
  },
  {
    id: "WRK-005",
    name: "David Kim",
    role: "Welder",
    contact: "+1 555-0105",
    certStatus: "Valid",
    trainingStatus: "Complete",
    assignedPPE: "Helmet, Welding Mask, Gloves",
    expiryDate: "2027-01-15",
  },
  {
    id: "WRK-006",
    name: "Lisa Martinez",
    role: "Plumber",
    contact: "+1 555-0106",
    certStatus: "Expiring",
    trainingStatus: "In Progress",
    assignedPPE: "Helmet, Gloves, Boots",
    expiryDate: "2026-04-10",
  },
  {
    id: "WRK-007",
    name: "Robert Brown",
    role: "Heavy Equipment Op.",
    contact: "+1 555-0107",
    certStatus: "Valid",
    trainingStatus: "Complete",
    assignedPPE: "Helmet, Vest, Harness",
    expiryDate: "2026-09-22",
  },
  {
    id: "WRK-008",
    name: "Emily Watson",
    role: "Scaffolder",
    contact: "+1 555-0108",
    certStatus: "Expired",
    trainingStatus: "Overdue",
    assignedPPE: "None",
    expiryDate: "2025-10-05",
  },
]

function getCertBadge(status: string) {
  switch (status) {
    case "Valid":
      return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
    case "Expiring":
      return "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20"
    case "Expired":
      return "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20"
    default:
      return ""
  }
}

function getTrainingBadge(status: string) {
  switch (status) {
    case "Complete":
      return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
    case "In Progress":
      return "bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/20"
    case "Overdue":
      return "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20"
    default:
      return ""
  }
}

interface WorkerTableProps {
  onOpenModal: () => void
}

export function WorkerTable({ onOpenModal }: WorkerTableProps) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [certFilter, setCertFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 5

  const filtered = workersData.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || w.role === roleFilter
    const matchesCert = certFilter === "all" || w.certStatus === certFilter
    return matchesSearch && matchesRole && matchesCert
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)
  const roles = [...new Set(workersData.map((w) => w.role))]

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onOpenModal}
            className="bg-[#FFC107] text-[#1a1a2e] hover:bg-[#ffca2c]"
          >
            Add Worker
          </Button>
          <Button variant="outline" className="border-border text-foreground">
            Import Workers
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 w-[160px] border-input bg-background text-foreground">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={certFilter} onValueChange={setCertFilter}>
            <SelectTrigger className="h-9 w-[160px] border-input bg-background text-foreground">
              <SelectValue placeholder="Cert Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Valid">Valid</SelectItem>
              <SelectItem value="Expiring">Expiring</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search workers..."
              className="h-9 w-52 rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-semibold text-muted-foreground">Worker ID</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Name</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Role</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Contact</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Certification</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Training</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Assigned PPE</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Expiry Date</TableHead>
              <TableHead className="text-right text-xs font-semibold text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((worker) => (
              <TableRow key={worker.id} className="border-border">
                <TableCell className="font-mono text-xs font-semibold text-card-foreground">
                  {worker.id}
                </TableCell>
                <TableCell className="text-sm font-medium text-card-foreground">
                  {worker.name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{worker.role}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{worker.contact}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${getCertBadge(worker.certStatus)}`}>
                    {worker.certStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${getTrainingBadge(worker.trainingStatus)}`}>
                    {worker.trainingStatus}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                  {worker.assignedPPE}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{worker.expiryDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`View ${worker.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Edit ${worker.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-[#dc2626]/10 hover:text-[#dc2626]"
                      aria-label={`Delete ${worker.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {(currentPage - 1) * perPage + 1} to{" "}
          {Math.min(currentPage * perPage, filtered.length)} of {filtered.length} workers
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? "bg-[#FFC107] text-[#1a1a2e]"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
