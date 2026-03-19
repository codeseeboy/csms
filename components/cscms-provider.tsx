"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { seedIncidents, seedInspections, seedUsers, seedWorkers } from "@/lib/cscms-seed"
import type {
  Assignment,
  AuditLog,
  ComplianceRecord,
  Incident,
  Inspection,
  Notification,
  User,
  Worker,
} from "@/lib/cscms-types"

type LoginResult = {
  ok: boolean
  message?: string
}

type IncidentInput = {
  title: string
  severity: "Low" | "Medium" | "High" | "Critical"
  location: string
  description: string
  date: string
  photoUrl?: string
  // Evidence upload is sent via JSON base64 so the API gateway can forward it.
  evidenceFile?: File
}

type ChecklistItemInput = {
  label: string
  compliant: boolean
  notes?: string
}

type CscmsContextValue = {
  users: User[]
  workers: Worker[]
  incidents: Incident[]
  inspections: Inspection[]
  complianceRecords: ComplianceRecord[]
  auditLogs: AuditLog[]
  notifications: Notification[]
  assignments: Assignment[]
  currentUser: User | null
  sessionToken: string | null
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  addAuditLog: (action: string, module: string, details: string) => void
  submitIncident: (payload: IncidentInput) => Promise<LoginResult>
  scheduleInspection: (site: string, inspectorEmail: string, date: string, type: string) => Promise<LoginResult>
  completeInspection: (
    inspectionId: string,
    passed: number,
    failed: number,
    checklistItems?: ChecklistItemInput[],
    evidenceFile?: File,
  ) => Promise<LoginResult>
  assignHighRiskTask: (workerId: string, task: string, note: string) => LoginResult
  uploadTrainingFile: (workerId: string, file: File) => LoginResult
  createWorker: (payload: { name: string; role: string; contact: string; assignedPPE: string; expiryDate: string }) => LoginResult
  updateWorker: (
    workerId: string,
    payload: { name: string; role: string; contact: string; assignedPPE: string; expiryDate: string },
  ) => LoginResult
  deleteWorker: (workerId: string) => LoginResult
  recordUnauthorizedAccess: (module: string) => void
  openIncidents: number
  activeInspections: number
  complianceRate: number
  expiringCerts: number
}

const CscmsContext = createContext<CscmsContextValue | null>(null)

const STORAGE_KEY = "cscms-state-v1"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"

function mapRole(role: string): User["role"] {
  if (role === "ADMIN") return "Admin"
  if (role === "SAFETY_INSPECTOR") return "Safety Inspector"
  if (role === "CONTRACTOR") return "Contractor"
  if (role === "WORKER") return "Worker"
  if (role === "AUTHORITY") return "Government Authority"
  return "Admin"
}

function nowIso() {
  return new Date().toISOString()
}

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function daysToExpiry(expiryDate: string) {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const ms = expiry.getTime() - now.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export function CscmsProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(seedUsers)

  const [workers, setWorkers] = useState<Worker[]>(seedWorkers)
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents)
  const [inspections, setInspections] = useState<Inspection[]>(seedInspections)
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return
    }
    try {
      const parsed = JSON.parse(raw) as Partial<CscmsContextValue>
      if (parsed.workers) setWorkers(parsed.workers)
      if (parsed.incidents) setIncidents(parsed.incidents)
      if (parsed.inspections) setInspections(parsed.inspections)
      if (parsed.complianceRecords) setComplianceRecords(parsed.complianceRecords)
      if (parsed.auditLogs) setAuditLogs(parsed.auditLogs)
      if (parsed.notifications) setNotifications(parsed.notifications)
      if (parsed.assignments) setAssignments(parsed.assignments)
      if (parsed.currentUser) setCurrentUser(parsed.currentUser)
      if (parsed.sessionToken) setSessionToken(parsed.sessionToken)
    } catch {
      // Ignore local state parse errors.
    }
  }, [])

  useEffect(() => {
    const state = {
      workers,
      incidents,
      inspections,
      complianceRecords,
      auditLogs,
      notifications,
      assignments,
      currentUser,
      sessionToken,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [workers, incidents, inspections, complianceRecords, auditLogs, notifications, assignments, currentUser, sessionToken])

  // SRS: Government Authority should never retain/view full audit logs.
  // If the active user is not Admin, clear auditLogs to avoid stale localStorage state.
  useEffect(() => {
    if (currentUser?.role !== "Admin") {
      setAuditLogs([])
    }
  }, [currentUser?.role])

  const callApi = async (path: string, options: RequestInit = {}, tokenOverride?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    }

    const token = tokenOverride ?? sessionToken
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => ({}))
    return { response, data }
  }

  // SRS/RBAC: currentUser.role must be derived from the active JWT, not only from localStorage.
  // Otherwise, stale localStorage can cause AuthGuard to deny correct users (e.g. /reports for Authority).
  useEffect(() => {
    if (!sessionToken) return

    let isCancelled = false

    const validate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/validate`, {
          method: "GET",
          headers: { Authorization: `Bearer ${sessionToken}` },
        })

        if (!res.ok) return

        const data = await res.json().catch(() => ({}))
        const u = data?.user
        if (!u?.role) return

        const seedUser = users.find((x) => x.email.toLowerCase() === String(u.email ?? "").toLowerCase())

        if (isCancelled) return
        setCurrentUser({
          id: String(u.id ?? ""),
          email: String(u.email ?? ""),
          role: mapRole(String(u.role ?? "ADMIN")),
          name: String(u.name ?? seedUser?.name ?? ""),
          phone: seedUser?.phone ?? "",
          password: seedUser?.password ?? "",
        })
      } catch {
        // best-effort; keep existing localStorage state if validation fails
      }
    }

    void validate()
    return () => {
      isCancelled = true
    }
  }, [sessionToken, users])

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = String(reader.result || "")
        const base64 = result.includes(";base64,") ? result.split(";base64,")[1] : result
        resolve(base64)
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })

  const syncAuditAndNotifications = async () => {
    try {
      const [notificationsRes, auditLogsRes, complianceRes] = await Promise.all([
        callApi("/auth/notifications", { method: "GET" }),
        callApi("/auth/audit-logs", { method: "GET" }),
        callApi("/auth/compliance-records", { method: "GET" }),
      ])

      if (notificationsRes.response.ok && Array.isArray(notificationsRes.data.items)) {
        setNotifications(notificationsRes.data.items as Notification[])
      }

      if (auditLogsRes.response.ok && Array.isArray(auditLogsRes.data.items)) {
        setAuditLogs(auditLogsRes.data.items as AuditLog[])
      }

      if (complianceRes.response.ok && Array.isArray(complianceRes.data.items)) {
        setComplianceRecords(complianceRes.data.items as ComplianceRecord[])
      }
    } catch {
      // best-effort sync; ignore if backend endpoints are unavailable
    }
  }

  useEffect(() => {
    if (!sessionToken) {
      return
    }

    let isCancelled = false

    const syncFromBackend = async () => {
      try {
        const [workersRes, incidentsRes, inspectionsRes, notificationsRes, auditLogsRes, complianceRes] = await Promise.all([
          callApi("/workers", { method: "GET" }),
          callApi("/incidents", { method: "GET" }),
          callApi("/inspections", { method: "GET" }),
          callApi("/auth/notifications", { method: "GET" }),
          callApi("/auth/audit-logs", { method: "GET" }),
          callApi("/auth/compliance-records", { method: "GET" }),
        ])

        if (isCancelled) {
          return
        }

        if (workersRes.response.ok && Array.isArray(workersRes.data.items)) {
          setWorkers(workersRes.data.items as Worker[])
        }

        if (incidentsRes.response.ok && Array.isArray(incidentsRes.data.items)) {
          setIncidents(incidentsRes.data.items as Incident[])
        }

        if (inspectionsRes.response.ok && Array.isArray(inspectionsRes.data.items)) {
          const mapped = (inspectionsRes.data.items as Array<Record<string, unknown>>).map((item) => ({
            id: String(item.id),
            site: String(item.site),
            inspectorName: String(item.inspectorName ?? "Inspector"),
            inspectorEmail: String(item.inspectorEmail),
            date: String(item.date),
            type: String(item.type),
            status: String(item.status) as Inspection["status"],
            score: typeof item.score === "number" ? item.score : undefined,
          }))
          setInspections(mapped)
        }

        if (notificationsRes.response.ok && Array.isArray(notificationsRes.data.items)) {
          setNotifications(notificationsRes.data.items as Notification[])
        }

        if (auditLogsRes.response.ok && Array.isArray(auditLogsRes.data.items)) {
          setAuditLogs(auditLogsRes.data.items as AuditLog[])
        }

        if (complianceRes.response.ok && Array.isArray(complianceRes.data.items)) {
          setComplianceRecords(complianceRes.data.items as ComplianceRecord[])
        }

        // Admin-only: fetch real users list from backend (SRS: Admin manages users/roles).
        try {
          if (currentUser?.role === "Admin") {
            const usersRes = await callApi("/auth/users", { method: "GET" })
            if (usersRes.response.ok && Array.isArray(usersRes.data.items)) {
              const mapped = (usersRes.data.items as Array<Record<string, unknown>>).map((u) => ({
                id: String(u.id),
                name: String(u.name),
                email: String(u.email),
                role: mapRole(String(u.role)),
                phone: String(u.phone ?? ""),
                password: "",
              })) as User[]
              setUsers(mapped)
            }
          }
        } catch {
          // best-effort; don't block other sync
        }
      } catch {
        // Keep localStorage state if backend sync fails.
      }
    }

    void syncFromBackend()

    return () => {
      isCancelled = true
    }
  }, [sessionToken])

  const addAuditLog = (action: string, module: string, details: string) => {
    const userId = currentUser?.id ?? "SYSTEM"
    setAuditLogs((prev) => [
      {
        id: randomId("AUDIT"),
        action,
        userId,
        module,
        details,
        timestamp: nowIso(),
      },
      ...prev,
    ])
  }

  const recordUnauthorizedAccess = (module: string) => {
    addAuditLog("UNAUTHORIZED_ACCESS", module, `Access blocked for ${currentUser?.email ?? "anonymous"}`)
  }

  const login = async (email: string, password: string): Promise<LoginResult> => {
    if (!email || !password) {
      return { ok: false, message: "Email and Password are required" }
    }

    try {
      const { response, data } = await callApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        return { ok: false, message: data.message ?? "Unable to login" }
      }

      const seedUser = users.find((u) => u.email.toLowerCase() === String(data.user?.email ?? "").toLowerCase())
      const user: User = {
        id: String(data.user?.id ?? ""),
        name: String(data.user?.name ?? ""),
        email: String(data.user?.email ?? email),
        role: mapRole(String(data.user?.role ?? "ADMIN")),
        phone: seedUser?.phone ?? "",
        password: seedUser?.password ?? "",
      }
      const token = String(data.token ?? "")

      if (!token) {
        return { ok: false, message: "Invalid login response from backend" }
      }

      setCurrentUser(user)
      setSessionToken(token)
      setAuditLogs((prev) => [
        {
          id: randomId("AUDIT"),
          action: "LOGIN_SUCCESS",
          userId: user.id,
          module: "/login",
          details: `Logged in as ${user.role}`,
          timestamp: nowIso(),
        },
        ...prev,
      ])

      return { ok: true }
    } catch {
      return { ok: false, message: "Unable to connect to backend" }
    }
  }

  const logout = () => {
    if (currentUser) {
      addAuditLog("LOGOUT", "/logout", `Logout by ${currentUser.email}`)
    }
    setCurrentUser(null)
    setSessionToken(null)
  }

  const submitIncident = async (payload: IncidentInput): Promise<LoginResult> => {
    if (!currentUser) {
      return { ok: false, message: "Please login first" }
    }

    try {
      let body: Record<string, unknown> = { ...payload }
      if (payload.evidenceFile) {
        const evidenceBase64 = await fileToBase64(payload.evidenceFile)
        body = {
          ...body,
          evidenceBase64,
          evidenceOriginalName: payload.evidenceFile.name,
          evidenceMimeType: payload.evidenceFile.type,
          evidenceSize: payload.evidenceFile.size,
        }
        delete body.evidenceFile
        // Keep photoUrl as undefined; backend will derive it from evidence.
        delete body.photoUrl
      }

      const { response, data } = await callApi("/incidents", {
        method: "POST",
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        return { ok: false, message: data.message ?? "Unable to submit incident" }
      }

      const incident = data as Incident
      setIncidents((prev) => [incident, ...prev])
      await syncAuditAndNotifications()
      return { ok: true }
    } catch {
      return { ok: false, message: "Unable to connect to backend" }
    }
  }

  const scheduleInspection = async (
    site: string,
    inspectorEmail: string,
    date: string,
    type: string,
  ): Promise<LoginResult> => {
    const inspector = users.find((u) => u.email === inspectorEmail)
    if (!inspector) {
      return { ok: false, message: "Inspector account not found" }
    }

    try {
      const { response, data } = await callApi("/inspections", {
        method: "POST",
        body: JSON.stringify({ site, inspectorEmail, date, type }),
      })

      if (!response.ok) {
        return { ok: false, message: data.message ?? "Unable to schedule inspection" }
      }

      const inspection: Inspection = {
        id: String(data.id),
        site: String(data.site),
        inspectorName: inspector.name,
        inspectorEmail: String(data.inspectorEmail),
        date: String(data.date),
        type: String(data.type),
        status: String(data.status) as Inspection["status"],
      }

      setInspections((prev) => [inspection, ...prev])
      await syncAuditAndNotifications()

      return { ok: true }
    } catch {
      return { ok: false, message: "Unable to connect to backend" }
    }
  }

  const completeInspection = async (
    inspectionId: string,
    passed: number,
    failed: number,
    checklistItems?: ChecklistItemInput[],
    evidenceFile?: File,
  ): Promise<LoginResult> => {
    const total = passed + failed
    if (total <= 0) {
      return { ok: false, message: "Checklist must include at least one item" }
    }

    const score = Math.round((passed / total) * 100)
    const current = inspections.find((item) => item.id === inspectionId)
    if (!current) {
      return { ok: false, message: "Inspection not found" }
    }

    try {
      let body: Record<string, unknown> = { passed, failed, checklistItems }

      if (evidenceFile) {
        const evidenceBase64 = await fileToBase64(evidenceFile)
        body = {
          ...body,
          evidenceBase64,
          evidenceOriginalName: evidenceFile.name,
          evidenceMimeType: evidenceFile.type,
          evidenceSize: evidenceFile.size,
        }
      }

      const { response, data } = await callApi(`/inspections/${inspectionId}/complete`, {
        method: "PATCH",
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        return { ok: false, message: data.message ?? "Unable to complete inspection" }
      }

      setInspections((prev) =>
        prev.map((item) => (item.id === inspectionId ? { ...item, status: "Completed", score } : item)),
      )
      await syncAuditAndNotifications()
      return { ok: true }
    } catch {
      return { ok: false, message: "Unable to connect to backend" }
    }
  }

  const assignHighRiskTask = (workerId: string, task: string, note: string): LoginResult => {
    if (!currentUser) {
      return { ok: false, message: "Please login first" }
    }
    const worker = workers.find((w) => w.id === workerId)
    if (!worker) {
      return { ok: false, message: "Worker not found" }
    }

    const expiresInDays = daysToExpiry(worker.expiryDate)
    const warningFlag = expiresInDays <= 7

    setAssignments((prev) => [
      {
        id: randomId("ASG"),
        workerId,
        task,
        note,
        warningFlag,
        assignedByUserId: currentUser.id,
        createdAt: nowIso(),
      },
      ...prev,
    ])

    if (warningFlag) {
      setWorkers((prev) =>
        prev.map((item) => (item.id === workerId ? { ...item, certStatus: "Expiring" } : item)),
      )
      setNotifications((prev) => [
        {
          id: randomId("NOTIF"),
          channel: "email",
          recipient: `${worker.name} <worker@cscms.com>`,
          subject: "Certification expiry reminder",
          message: "Your certification expires in 7 days. Please renew immediately.",
          timestamp: nowIso(),
        },
        ...prev,
      ])
    }

    addAuditLog("WORKER_ASSIGNED", "/workers", `Assigned ${worker.name} to ${task} with warningFlag=${warningFlag}`)

    return { ok: true }
  }

  const uploadTrainingFile = async (workerId: string, file: File): Promise<LoginResult> => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"]
    const maxSize = 5 * 1024 * 1024

    if (file.size > maxSize) {
      return { ok: false, message: "File size exceeds 5 MB limit. Please upload a smaller file." }
    }

    if (!allowed.includes(file.type)) {
      return { ok: false, message: "Invalid file type. Only PDF, JPG, and PNG are allowed." }
    }

    try {
      const trainingBase64 = await fileToBase64(file)
      const { response, data } = await callApi(`/workers/${workerId}/training`, {
        method: "POST",
        body: JSON.stringify({
          trainingBase64,
          trainingOriginalName: file.name,
          trainingMimeType: file.type,
        }),
      })

      if (!response.ok) {
        return { ok: false, message: data.message ?? "Unable to upload training" }
      }

      // Refresh workers and audit/notifications after successful upload.
      const workersRes = await callApi("/workers", { method: "GET" })
      if (workersRes.response.ok && Array.isArray(workersRes.data.items)) {
        setWorkers(workersRes.data.items as Worker[])
      }
      await syncAuditAndNotifications()

      return { ok: true }
    } catch {
      return { ok: false, message: "Unable to connect to backend" }
    }
  }

  const computeCertStatus = (expiryDate: string) => {
    if (!expiryDate) return "Valid" as const
    const exp = new Date(expiryDate)
    if (Number.isNaN(exp.getTime())) return "Valid" as const
    const now = new Date()
    if (exp.getTime() < now.getTime()) return "Expired" as const
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    if (exp.getTime() <= in30.getTime()) return "Expiring" as const
    return "Valid" as const
  }

  const refreshWorkers = async () => {
    const workersRes = await callApi("/workers", { method: "GET" })
    if (workersRes.response.ok && Array.isArray(workersRes.data.items)) {
      setWorkers(workersRes.data.items as Worker[])
    }
  }

  const createWorker = async (payload: { name: string; role: string; contact: string; assignedPPE: string; expiryDate: string }): Promise<LoginResult> => {
    if (!currentUser || !sessionToken) return { ok: false, message: "Please login first" }
    try {
      const certStatus = computeCertStatus(payload.expiryDate)
      const { response, data } = await callApi("/workers", {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          role: payload.role,
          contact: payload.contact,
          certStatus,
          trainingStatus: "In Progress",
          assignedPPE: payload.assignedPPE,
          expiryDate: payload.expiryDate || null,
        }),
      })

      if (!response.ok) {
        return { ok: false, message: (data as Record<string, unknown>)?.message ?? "Unable to create worker" }
      }

      await refreshWorkers()
      await syncAuditAndNotifications()
      return { ok: true }
    } catch {
      return { ok: false, message: "Unable to connect to backend" }
    }
  }

  const updateWorker = async (
    workerId: string,
    payload: { name: string; role: string; contact: string; assignedPPE: string; expiryDate: string },
  ): Promise<LoginResult> => {
    if (!currentUser || !sessionToken) return { ok: false, message: "Please login first" }
    try {
      const certStatus = computeCertStatus(payload.expiryDate)
      const { response, data } = await callApi(`/workers/${workerId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: payload.name,
          role: payload.role,
          contact: payload.contact,
          certStatus,
          trainingStatus: "In Progress",
          assignedPPE: payload.assignedPPE,
          expiryDate: payload.expiryDate || null,
        }),
      })

      if (!response.ok) {
        return { ok: false, message: (data as Record<string, unknown>)?.message ?? "Unable to update worker" }
      }

      await refreshWorkers()
      await syncAuditAndNotifications()
      return { ok: true }
    } catch {
      return { ok: false, message: "Unable to connect to backend" }
    }
  }

  const deleteWorker = async (workerId: string): Promise<LoginResult> => {
    if (!currentUser || !sessionToken) return { ok: false, message: "Please login first" }
    try {
      const { response, data } = await callApi(`/workers/${workerId}`, { method: "DELETE" })
      if (!response.ok) return { ok: false, message: (data as Record<string, unknown>)?.message ?? "Unable to delete worker" }

      await refreshWorkers()
      await syncAuditAndNotifications()
      return { ok: true }
    } catch {
      return { ok: false, message: "Unable to connect to backend" }
    }
  }

  const openIncidents = incidents.filter((item) => item.status === "Open").length
  const activeInspections = inspections.filter((item) => item.status === "Scheduled").length
  const completedInspections = inspections.filter((item) => item.status === "Completed")
  const complianceRate =
    completedInspections.length === 0
      ? 0
      : Math.round(
          completedInspections.reduce((sum, item) => sum + (item.score ?? 0), 0) / completedInspections.length,
        )
  const expiringCerts = workers.filter((item) => item.certStatus === "Expiring").length

  const value = useMemo<CscmsContextValue>(
    () => ({
      users,
      workers,
      incidents,
      inspections,
      complianceRecords,
      auditLogs,
      notifications,
      assignments,
      currentUser,
      sessionToken,
      login,
      logout,
      addAuditLog,
      submitIncident,
      scheduleInspection,
      completeInspection,
      assignHighRiskTask,
      uploadTrainingFile,
      createWorker,
      updateWorker,
      deleteWorker,
      recordUnauthorizedAccess,
      openIncidents,
      activeInspections,
      complianceRate,
      expiringCerts,
    }),
    [
      users,
      workers,
      incidents,
      inspections,
      complianceRecords,
      auditLogs,
      notifications,
      assignments,
      currentUser,
      sessionToken,
      createWorker,
      updateWorker,
      deleteWorker,
      openIncidents,
      activeInspections,
      complianceRate,
      expiringCerts,
    ],
  )

  return <CscmsContext.Provider value={value}>{children}</CscmsContext.Provider>
}

export function useCscms() {
  const context = useContext(CscmsContext)
  if (!context) {
    throw new Error("useCscms must be used within CscmsProvider")
  }
  return context
}
