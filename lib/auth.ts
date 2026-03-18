// Mock user database and auth service
// In production, this would connect to a real database

export type UserRole = 'ADMIN' | 'SAFETY_INSPECTOR' | 'CONTRACTOR' | 'WORKER' | 'AUTHORITY'

export type User = {
  id: string
  email: string
  name: string
  password: string // In prod: hashed
  role: UserRole
  phone?: string
  site?: string
}

// Mock user database with test users from test cases
export const mockUsers: User[] = [
  {
    id: 'USR-001',
    email: 'admin@cscms.com',
    name: 'Admin User',
    password: 'Admin@123',
    role: 'ADMIN',
    phone: '+1-555-0001',
  },
  {
    id: 'USR-002',
    email: 'inspector@cscms.com',
    name: 'Ravi Kumar',
    password: 'Safe@1234',
    role: 'SAFETY_INSPECTOR',
    phone: '+1-555-0002',
    site: 'Site A',
  },
  {
    id: 'USR-003',
    email: 'contractor@cscms.com',
    name: 'Contractor User',
    password: 'Cont@1234',
    role: 'CONTRACTOR',
    phone: '+1-555-0003',
  },
  {
    id: 'USR-004',
    email: 'worker@cscms.com',
    name: 'Field Worker',
    password: 'Work@1234',
    role: 'WORKER',
    phone: '+1-555-0004',
  },
  {
    id: 'USR-005',
    email: 'authority@cscms.com',
    name: 'Government Authority',
    password: 'Auth@1234',
    role: 'AUTHORITY',
    phone: '+1-555-0005',
  },
]

export type Session = {
  userId: string
  email: string
  name: string
  role: UserRole
  token: string
  expiresAt: number
}

// Mock session storage (in prod: secure HTTP-only cookies + backend sessions)
const sessions = new Map<string, Session>()

export function authenticateUser(email: string, password: string): Session | null {
  const user = mockUsers.find((u) => u.email === email && u.password === password)

  if (!user) {
    return null
  }

  const token = `jwt_${user.id}_${Date.now()}`
  const session: Session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }

  sessions.set(token, session)
  return session
}

export function getSession(token: string): Session | null {
  const session = sessions.get(token)
  if (!session) {
    return null
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token)
    return null
  }

  return session
}

export function invalidateSession(token: string): void {
  sessions.delete(token)
}

export function validateUserExists(email: string): boolean {
  return mockUsers.some((u) => u.email === email)
}

export const ROLE_BASED_ACCESS: Record<UserRole, string[]> = {
  ADMIN: [
    '/dashboard',
    '/workers',
    '/inspections',
    '/incident-reports',
    '/ppe-management',
    '/reports',
    '/admin/users',
    '/admin/audit-logs',
  ],
  SAFETY_INSPECTOR: [
    '/dashboard',
    '/workers',
    '/incident-reports',
    '/inspections',
    '/reports',
  ],
  CONTRACTOR: [
    '/dashboard',
    '/workers',
    '/incident-reports',
  ],
  WORKER: [
    '/dashboard',
    '/training',
    '/safety-updates',
  ],
  AUTHORITY: [
    '/reports',
  ],
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const allowedRoutes = ROLE_BASED_ACCESS[role] || []
  return allowedRoutes.some((r) => route === r || route.startsWith(r + '/'))
}
