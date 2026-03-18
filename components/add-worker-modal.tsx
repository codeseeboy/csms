"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddWorkerModalProps {
  open: boolean
  onClose: () => void
}

export function AddWorkerModal({ open, onClose }: AddWorkerModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    role: "",
    contact: "",
    email: "",
    certExpiry: "",
    ppe: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would send data to an API
    onClose()
    setFormData({ fullName: "", role: "", contact: "", email: "", certExpiry: "", ppe: "" })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border bg-card sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-card-foreground">
            Add New Worker
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm text-card-foreground">
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="border-input bg-background text-foreground"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm text-card-foreground">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(val) =>
                  setFormData({ ...formData, role: val })
                }
              >
                <SelectTrigger className="border-input bg-background text-foreground">
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
              <Label htmlFor="contact" className="text-sm text-card-foreground">
                Contact Number
              </Label>
              <Input
                id="contact"
                placeholder="+1 555-0000"
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
                className="border-input bg-background text-foreground"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-card-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="worker@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border-input bg-background text-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certification" className="text-sm text-card-foreground">
              Upload Certification
            </Label>
            <Input
              id="certification"
              type="file"
              accept=".pdf,.jpg,.png"
              className="border-input bg-background text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-[#FFC107] file:px-3 file:py-1 file:text-sm file:font-medium file:text-[#1a1a2e]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="certExpiry" className="text-sm text-card-foreground">
                Certification Expiry
              </Label>
              <Input
                id="certExpiry"
                type="date"
                value={formData.certExpiry}
                onChange={(e) =>
                  setFormData({ ...formData, certExpiry: e.target.value })
                }
                className="border-input bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ppe" className="text-sm text-card-foreground">
                Assign PPE
              </Label>
              <Select
                value={formData.ppe}
                onValueChange={(val) =>
                  setFormData({ ...formData, ppe: val })
                }
              >
                <SelectTrigger className="border-input bg-background text-foreground">
                  <SelectValue placeholder="Select PPE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Helmet, Vest, Boots">Helmet, Vest, Boots</SelectItem>
                  <SelectItem value="Helmet, Harness, Gloves">Helmet, Harness, Gloves</SelectItem>
                  <SelectItem value="Helmet, Gloves, Goggles">Helmet, Gloves, Goggles</SelectItem>
                  <SelectItem value="Helmet, Welding Mask, Gloves">Helmet, Welding Mask, Gloves</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#FFC107] text-[#1a1a2e] hover:bg-[#ffca2c]"
            >
              Add Worker
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
