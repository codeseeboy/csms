export type UserRole =
  | "Admin"
  | "Safety Inspector"
  | "Worker"
  | "Contractor"
  | "Government Authority"

export type User = {
  id: string
  name: string
  email: string
  password?: string
  role: UserRole
  phone: string
}

export type Worker = {
  id: string
  name: string
  role: string
  contact: string
  site?: string
  certStatus: "Valid" | "Expiring" | "Expired"
  trainingStatus: "Complete" | "In Progress" | "Overdue"
  assignedPPE: string
  expiryDate: string
  userId?: string
}

export type Incident = {
  id: string
  title: string
  severity: "Low" | "Medium" | "High" | "Critical"
  location: string
  description: string
  date: string
  status: "Open" | "Under Review" | "Resolved"
  photoUrl?: string
  createdByUserId: string
}

export type Inspection = {
  id: string
  site: string
  inspectorName: string
  inspectorEmail: string
  date: string
  type: string
  status: "Scheduled" | "Completed"
  score?: number
}

export type ComplianceRecord = {
  id: string
  inspectionId: string
  site: string
  inspectorName: string
  score: number
  createdAt: string
}

export type AuditLog = {
  id: string
  action: string
  userId: string
  module: string
  details: string
  timestamp: string
}

export type Notification = {
  id: string
  channel: "email" | "sms"
  recipient: string
  subject?: string
  message: string
  timestamp: string
}

export type Assignment = {
  id: string
  workerId: string
  task: string
  note: string
  warningFlag: boolean
  assignedByUserId: string
  createdAt: string
}
