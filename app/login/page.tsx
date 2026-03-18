"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HardHat, Mail, Lock, Loader2 } from "lucide-react"
import { useCscms } from "@/components/cscms-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

const roleHomePath: Record<string, string> = {
  Admin: "/dashboard",
  "Safety Inspector": "/dashboard",
  Contractor: "/workers",
  Worker: "/training",
  "Government Authority": "/reports",
}

export default function LoginPage() {
  const { login, currentUser } = useCscms()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      router.replace(roleHomePath[currentUser.role] ?? "/dashboard")
    }
  }, [currentUser, router])

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validation
    if (!email || !password) {
      setError("Email and Password are required")
      setIsLoading(false)
      return
    }

    const result = await login(email, password)
    
    if (!result.ok) {
      setError(result.message ?? "Unable to login")
      setIsLoading(false)
      return
    }

    const role =
      email.toLowerCase() === "admin@cscms.com"
        ? "Admin"
        : email.toLowerCase() === "inspector@cscms.com"
          ? "Safety Inspector"
          : email.toLowerCase() === "contractor@cscms.com"
            ? "Contractor"
            : email.toLowerCase() === "worker@cscms.com"
              ? "Worker"
              : email.toLowerCase() === "authority@cscms.com"
                ? "Government Authority"
                : "Admin"

    router.push(roleHomePath[role] ?? "/dashboard")
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen min-h-dvh items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <HardHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">CSCMS Login</h1>
            <p className="text-xs text-muted-foreground">Construction Safety and Compliance</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="inspector@cscms.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Test credentials hint */}
        <div className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">Test Credentials:</p>
          <div className="space-y-1">
            <p><strong>Admin:</strong> admin@cscms.com / Admin@123</p>
            <p><strong>Inspector:</strong> inspector@cscms.com / Safe@1234</p>
            <p><strong>Contractor:</strong> contractor@cscms.com / Cont@1234</p>
            <p><strong>Worker:</strong> worker@cscms.com / Work@1234</p>
            <p><strong>Authority:</strong> authority@cscms.com / Auth@1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}
