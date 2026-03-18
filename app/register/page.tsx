"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  })
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (!form.name || !form.email || !form.password) {
      setMessage("Name, email, and password are required.")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          // By default we create Worker accounts.
          // Admin can manage roles later via Admin -> Users.
          role: "WORKER",
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(data.message ?? "Registration failed.")
        setIsLoading(false)
        return
      }

      setMessage("Account created successfully. Please sign in.")
      setIsLoading(false)
      setTimeout(() => router.push("/login"), 900)
    } catch {
      setMessage("Network error. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-14">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a worker account. Admin can manage roles and users later.
          </p>
        </div>

        <form className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Rahul Sharma"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="worker@company.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Phone (optional)</label>
            <input
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555-0000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          {message && <p className="text-sm text-muted-foreground">{message}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="h-10 w-full rounded-lg bg-[#FFC107] text-[#1a1a2e] font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Account"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-foreground underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

