"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  HardHat,
  ShieldCheck,
  ClipboardCheck,
  Users,
  FileBarChart,
  Lock,
  Mail,
  Phone,
  User,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"

const roles = [
  { value: "ADMIN", label: "Admin", description: "Full system access — manage users, sites, and all modules", icon: Lock, color: "#2C3E50" },
  { value: "SAFETY_INSPECTOR", label: "Safety Inspector", description: "Conduct inspections, complete checklists, report violations", icon: ClipboardCheck, color: "#FFC107" },
  { value: "CONTRACTOR", label: "Contractor", description: "Manage worker teams, certifications, and incident reports", icon: HardHat, color: "#FF6F00" },
  { value: "WORKER", label: "Worker", description: "View training, safety updates, and certification status", icon: Users, color: "#10b981" },
  { value: "AUTHORITY", label: "Government Authority", description: "Access compliance reports, audit logs, and inspection records", icon: FileBarChart, color: "#6366f1" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" })
  const [selectedRole, setSelectedRole] = useState("WORKER")
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (!form.name || !form.email || !form.password) {
      setMessage({ text: "Name, email, and password are required.", ok: false })
      setIsLoading(false)
      return
    }

    if (form.password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", ok: false })
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
          role: selectedRole,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ text: data.message ?? "Registration failed.", ok: false })
        setIsLoading(false)
        return
      }

      setMessage({ text: "Account created! Redirecting to sign in...", ok: true })
      setIsLoading(false)
      setTimeout(() => router.push("/login"), 1200)
    } catch {
      setMessage({ text: "Network error. Please try again.", ok: false })
      setIsLoading(false)
    }
  }

  const activeRole = roles.find((r) => r.value === selectedRole)!

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFC107]">
              <HardHat className="h-5 w-5 text-[#1a1a2e]" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">CSCMS</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Already have an account? <span className="font-semibold text-foreground underline">Sign In</span>
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="animate-fade-in-up text-center">
          <h1 className="text-3xl font-bold text-foreground">Create Your Account</h1>
          <p className="mt-2 text-muted-foreground">Select your role and fill in your details to get started.</p>
        </div>

        {/* Steps indicator */}
        <div className="animate-fade-in-up delay-100 mx-auto mt-8 flex max-w-md items-center justify-center gap-3">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${step === 1 ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[10px] font-bold">
              <span className={step === 1 ? "text-background" : "text-foreground"}>1</span>
            </span>
            Choose Role
          </button>
          <div className="h-px w-8 bg-border" />
          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${step === 2 ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-[10px] font-bold">
              <span className={step === 2 ? "text-background" : "text-foreground"}>2</span>
            </span>
            Your Details
          </button>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="animate-fade-in-up delay-200 mt-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => {
                const isSelected = selectedRole === role.value
                return (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`hover-lift group relative rounded-2xl border-2 p-5 text-left transition-all ${
                      isSelected
                        ? "border-[#FFC107] bg-[#FFC107]/5 shadow-lg shadow-[#FFC107]/10"
                        : "border-border bg-card hover:border-border/60"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute right-3 top-3">
                        <CheckCircle2 className="h-5 w-5 text-[#FFC107]" />
                      </div>
                    )}
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${role.color}15` }}
                    >
                      <role.icon className="h-5 w-5" style={{ color: role.color }} />
                    </div>
                    <h3 className="mt-3 font-semibold text-foreground">{role.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{role.description}</p>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setStep(2)}
                className="group flex items-center gap-2 rounded-xl bg-[#FFC107] px-8 py-3 text-sm font-bold text-[#1a1a2e] transition-all hover:bg-[#ffca2c] hover:shadow-lg hover:shadow-[#FFC107]/25"
              >
                Continue as {activeRole.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details Form */}
        {step === 2 && (
          <div className="animate-fade-in-up delay-200 mx-auto mt-8 max-w-md">
            {/* Selected role badge */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                <activeRole.icon className="h-4 w-4" style={{ color: activeRole.color }} />
                <span className="text-sm font-medium text-foreground">{activeRole.label}</span>
                <button onClick={() => setStep(1)} className="ml-1 text-xs text-muted-foreground underline hover:text-foreground">
                  Change
                </button>
              </div>
            </div>

            <form className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Rahul Sharma"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phone <span className="text-muted-foreground">(optional)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765-43210"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#FFC107] focus:outline-none focus:ring-1 focus:ring-[#FFC107]"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters"
                  />
                </div>
              </div>

              {message && (
                <div className={`rounded-lg border p-3 text-sm ${message.ok ? "border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981]" : "border-[#dc2626]/30 bg-[#dc2626]/5 text-[#dc2626]"}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-[#FFC107] text-sm font-bold text-[#1a1a2e] transition-all hover:bg-[#ffca2c] hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-foreground underline">Sign In</Link>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
