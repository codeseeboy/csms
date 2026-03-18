"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TopNavbar } from "@/components/top-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCscms } from "@/components/cscms-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"

function mapFrontRoleToBack(role: string) {
  const r = String(role || "")
  if (r === "Admin") return "ADMIN"
  if (r === "Safety Inspector") return "SAFETY_INSPECTOR"
  if (r === "Contractor") return "CONTRACTOR"
  if (r === "Worker") return "WORKER"
  if (r === "Government Authority") return "AUTHORITY"
  return "ADMIN"
}

export default function AdminUsersPage() {
  const { users, sessionToken } = useCscms()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Worker",
    phone: "",
  })
  const [message, setMessage] = useState<string | null>(null)

  const [updatingUserId, setUpdatingUserId] = useState<string>("")
  const [updatingRole, setUpdatingRole] = useState<string>("Worker")

  const createUser = async () => {
    if (!sessionToken) return
    setMessage(null)
    const res = await fetch(`${API_BASE_URL}/auth/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: mapFrontRoleToBack(form.role),
        phone: form.phone,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMessage(data.message ?? "Failed to create user")
      return
    }
    setMessage("User created successfully.")
    // Best-effort refresh: reload the page to re-sync users list.
    window.location.reload()
  }

  const updateUserRole = async (userId: string) => {
    if (!sessionToken) return
    setMessage(null)
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ role: mapFrontRoleToBack(updatingRole) }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMessage(data.message ?? "Failed to update role")
      return
    }
    setMessage("Role updated successfully.")
    window.location.reload()
  }

  return (
    <AuthGuard allowedRoles={["Admin"]}>
      <DashboardLayout>
        <TopNavbar title="Admin Users" />
        <div className="space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input
                placeholder="Temporary password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Safety Inspector">Safety Inspector</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                  <SelectItem value="Worker">Worker</SelectItem>
                  <SelectItem value="Government Authority">Government Authority</SelectItem>
                </SelectContent>
              </Select>

              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

              {message && <p className="text-sm text-muted-foreground">{message}</p>}
              <Button className="bg-[#FFC107] text-[#1a1a2e] hover:bg-[#ffca2c]" onClick={() => void createUser()}>
                Create User
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.role} | {user.email} | {user.id}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={updatingUserId === user.id ? updatingRole : user.role}
                          onValueChange={(v) => {
                            setUpdatingUserId(user.id)
                            setUpdatingRole(v)
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Safety Inspector">Safety Inspector</SelectItem>
                            <SelectItem value="Contractor">Contractor</SelectItem>
                            <SelectItem value="Worker">Worker</SelectItem>
                            <SelectItem value="Government Authority">Government Authority</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => void updateUserRole(user.id)}>
                          Update
                        </Button>
                      </div>
                    </div>
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
