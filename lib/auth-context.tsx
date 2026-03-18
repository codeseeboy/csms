'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Session, UserRole } from '@/lib/auth'

interface AuthContextType {
  session: Session | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  canAccess: (route: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api'

  // Load session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('cscms_token')
    if (token) {
      // In a real app, validate token with backend
      const storedSession = localStorage.getItem('cscms_session')
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession)
          // Check expiry
          if (parsedSession.expiresAt > Date.now()) {
            setSession(parsedSession)
          } else {
            localStorage.removeItem('cscms_token')
            localStorage.removeItem('cscms_session')
          }
        } catch (e) {
          console.error('Failed to parse session:', e)
        }
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.message || 'Login failed' }
      }

      const newSession: Session = {
        userId: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        token: data.token,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }
      setSession(newSession)
      localStorage.setItem('cscms_token', newSession.token)
      localStorage.setItem('cscms_session', JSON.stringify(newSession))

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setSession(null)
    localStorage.removeItem('cscms_token')
    localStorage.removeItem('cscms_session')
  }

  const canAccess = (route: string): boolean => {
    if (!session) return false
    const ROLE_ACCESS: Record<UserRole, string[]> = {
      ADMIN: [
        '/dashboard',
        '/workers',
        '/inspections',
        '/incident-reports',
        '/ppe-management',
        '/reports',
        '/admin',
      ],
      SAFETY_INSPECTOR: [
        '/dashboard',
        '/workers',
        '/incident-reports',
        '/inspections',
        '/reports',
      ],
      CONTRACTOR: ['/dashboard', '/workers', '/incident-reports'],
      WORKER: ['/dashboard', '/training', '/safety-updates'],
      AUTHORITY: ['/reports'],
    }
    const allowed = ROLE_ACCESS[session.role] || []
    return allowed.some((r) => route === r || route.startsWith(r + '/'))
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
