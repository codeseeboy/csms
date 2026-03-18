"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCscms } from "@/components/cscms-provider"
import {
  HardHat,
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  FileBarChart,
  Users,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Lock,
  Smartphone,
  ChevronRight,
  Star,
} from "lucide-react"

function useCountUp(end: number, duration = 2000) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!ref.current || started.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()
          const tick = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return { value, ref }
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

const stats = [
  { label: "Sites Monitored", end: 2500, suffix: "+" },
  { label: "Inspections Completed", end: 18400, suffix: "+" },
  { label: "Incidents Resolved", end: 9200, suffix: "+" },
  { label: "Compliance Score", end: 98, suffix: "%" },
]

const features = [
  {
    icon: ClipboardCheck,
    title: "Digital Safety Checklists",
    description: "Replace paper checklists with interactive digital forms. Track PPE compliance, safety protocols, and site conditions in real-time.",
    color: "#FFC107",
  },
  {
    icon: AlertTriangle,
    title: "Incident Reporting & Evidence",
    description: "Report incidents instantly with photo/video evidence. Automatic severity classification and notification routing to stakeholders.",
    color: "#FF6F00",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Tracking",
    description: "Monitor certification expiry dates, training completion status, and regulatory compliance across all workers and sites.",
    color: "#10b981",
  },
  {
    icon: FileBarChart,
    title: "Audit-Ready Reports",
    description: "Generate PDF and Excel compliance reports with one click. Filter by date range, site, or inspector for government audits.",
    color: "#6366f1",
  },
  {
    icon: Users,
    title: "Worker Management",
    description: "Manage worker profiles, certifications, training documents, and PPE assignments from a centralized dashboard.",
    color: "#2C3E50",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Visualize safety trends, incident patterns, and compliance metrics with interactive charts and real-time KPI indicators.",
    color: "#ec4899",
  },
]

const roles = [
  {
    title: "Admin",
    description: "Full system control — manage users, configure sites, oversee all modules, and generate audit reports.",
    icon: Lock,
    gradient: "from-[#2C3E50] to-[#3d566e]",
  },
  {
    title: "Safety Inspector",
    description: "Conduct inspections, complete checklists, verify PPE compliance, and report safety violations.",
    icon: ClipboardCheck,
    gradient: "from-[#FFC107] to-[#ffca2c]",
    dark: true,
  },
  {
    title: "Contractor",
    description: "Manage worker teams, track certifications, submit incident reports, and monitor site compliance.",
    icon: HardHat,
    gradient: "from-[#FF6F00] to-[#ff8f33]",
  },
  {
    title: "Worker",
    description: "View safety updates, access training materials, and upload required certification documents.",
    icon: Users,
    gradient: "from-[#10b981] to-[#34d399]",
  },
  {
    title: "Government Authority",
    description: "Access compliance reports, audit logs, and inspection records for regulatory oversight.",
    icon: FileBarChart,
    gradient: "from-[#6366f1] to-[#818cf8]",
  },
]

const testimonials = [
  { name: "Rajesh Kumar", role: "Site Manager, BuildCo", text: "Reduced incident response time by 60%. The real-time alerts are a game changer for our 15 active sites.", rating: 5 },
  { name: "Priya Sharma", role: "Safety Officer, InfraTech", text: "Audit preparation went from 2 weeks to 2 hours. Government inspectors are impressed with our digital compliance records.", rating: 5 },
  { name: "Amit Patel", role: "Contractor, SteelWorks", text: "Worker certification tracking alone has saved us from 3 potential regulatory violations this quarter.", rating: 5 },
]

function StatCard({ label, end, suffix }: { label: string; end: number; suffix: string }) {
  const { value, ref } = useCountUp(end)
  return (
    <div ref={ref} className="text-center">
      <p className="text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="mt-1 text-xs text-white/70 sm:mt-2 sm:text-sm">{label}</p>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { currentUser } = useCscms()

  const features1 = useScrollReveal()
  const features2 = useScrollReveal()
  const rolesSection = useScrollReveal()
  const testimonialsSection = useScrollReveal()
  const ctaSection = useScrollReveal()

  const [activeFeature, setActiveFeature] = useState(0)

  const cycleFeature = useCallback(() => {
    setActiveFeature((prev) => (prev + 1) % features.length)
  }, [])

  useEffect(() => {
    const interval = setInterval(cycleFeature, 4000)
    return () => clearInterval(interval)
  }, [cycleFeature])

  useEffect(() => {
    if (!currentUser) return
    if (currentUser.role === "Worker") { router.replace("/training"); return }
    if (currentUser.role === "Government Authority") { router.replace("/reports"); return }
    if (currentUser.role === "Contractor") { router.replace("/workers"); return }
    router.replace("/dashboard")
  }, [currentUser, router])

  if (currentUser) return null

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background">
      {/* ───── Navbar ───── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 min-h-[3.5rem] max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFC107]">
              <HardHat className="h-5 w-5 text-[#1a1a2e]" />
            </div>
            <span className="truncate text-base font-bold text-foreground tracking-tight sm:text-lg">CSCMS</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#roles" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Roles</a>
            <a href="#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Testimonials</a>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted active:bg-muted sm:px-4">
              Sign In
            </Link>
            <Link href="/register" className="rounded-lg bg-[#FFC107] px-3 py-2 text-sm font-semibold text-[#1a1a2e] transition-all hover:bg-[#ffca2c] active:opacity-90 sm:px-4">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2332] via-[#2C3E50] to-[#1a2332]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #FFC107 0%, transparent 50%), radial-gradient(circle at 80% 20%, #FF6F00 0%, transparent 50%), radial-gradient(circle at 60% 80%, #6366f1 0%, transparent 50%)" }} />

        {/* Floating icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] animate-float delay-100 opacity-10">
            <HardHat className="h-16 w-16 text-[#FFC107]" />
          </div>
          <div className="absolute top-40 right-[15%] animate-float delay-300 opacity-10">
            <ShieldCheck className="h-14 w-14 text-[#10b981]" />
          </div>
          <div className="absolute bottom-32 left-[20%] animate-float delay-500 opacity-10">
            <ClipboardCheck className="h-12 w-12 text-[#6366f1]" />
          </div>
          <div className="absolute bottom-20 right-[25%] animate-float delay-700 opacity-10">
            <AlertTriangle className="h-10 w-10 text-[#FF6F00]" />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm sm:px-4 sm:text-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#10b981]">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[#10b981] opacity-60" />
              </span>
              Construction Safety Compliance Platform
            </div>

            <h1 className="animate-fade-in-up delay-200 mt-6 text-3xl font-extrabold leading-tight tracking-tight text-white sm:mt-8 sm:text-4xl md:text-5xl lg:text-6xl">
              Build Safer.{" "}
              <span className="bg-gradient-to-r from-[#FFC107] to-[#FF6F00] bg-clip-text text-transparent">
                Stay Compliant.
              </span>
            </h1>

            <p className="animate-fade-in-up delay-400 mt-4 text-base text-white/60 sm:mt-6 sm:text-lg md:text-xl">
              Digitize safety checklists, report incidents with evidence, track certifications,
              and generate audit-ready compliance reports — all from one platform.
            </p>

            <div className="animate-fade-in-up delay-600 mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4">
              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-xl bg-[#FFC107] px-6 py-3 text-sm font-bold text-[#1a1a2e] transition-all hover:bg-[#ffca2c] hover:shadow-xl hover:shadow-[#FFC107]/30"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>

            <div className="animate-fade-in-up delay-800 mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/50 sm:mt-8 sm:gap-6 sm:text-sm">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#10b981]" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#10b981]" /> 5 roles supported</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#10b981]" /> Audit-ready exports</span>
            </div>
          </div>
        </div>

        {/* Bottom wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 46.7C840 53.3 960 66.7 1080 73.3C1200 80 1320 80 1380 80H1440V80H0Z" fill="var(--background)" />
          </svg>
        </div>
      </section>

      {/* ───── Stats ───── */}
      <section className="relative -mt-1 bg-[#1a2332] py-10 sm:py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 sm:gap-6 sm:px-6 md:grid-cols-4 md:gap-8">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0">
              <StatCard {...s} />
            </div>
          ))}
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div ref={features1.ref} className={`mx-auto max-w-2xl text-center transition-all duration-700 ${features1.visible ? "animate-fade-in-up" : "opacity-0"}`}>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#FFC107]">Features</p>
            <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">Everything You Need for Construction Safety</h2>
            <p className="mt-4 text-muted-foreground">Comprehensive tools designed for the construction industry's unique safety and compliance requirements.</p>
          </div>

          <div ref={features2.ref} className="mt-10 sm:mt-16">
            {/* Feature selector tabs */}
            <div className="mx-auto mb-8 flex max-w-4xl flex-wrap justify-center gap-1.5 sm:mb-12 sm:gap-2">
              {features.map((f, i) => (
                <button
                  key={f.title}
                  onClick={() => setActiveFeature(i)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeFeature === i
                      ? "bg-foreground text-background shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  <f.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{f.title.split(" ").slice(0, 2).join(" ")}</span>
                </button>
              ))}
            </div>

            {/* Active feature display */}
            <div className="mx-auto max-w-4xl">
              <div
                key={activeFeature}
                className="animate-scale-in flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-6 shadow-xl sm:gap-8 sm:rounded-3xl sm:p-8 md:flex-row md:p-12"
              >
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${features[activeFeature].color}15` }}>
                  {(() => { const Icon = features[activeFeature].icon; return <Icon className="h-12 w-12" style={{ color: features[activeFeature].color }} /> })()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground md:text-2xl">{features[activeFeature].title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{features[activeFeature].description}</p>
                  <Link href="/register" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#FFC107] hover:underline">
                    Learn more <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature grid cards */}
            <div className={`mt-8 grid grid-cols-1 gap-3 sm:mt-12 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-700 ${features2.visible ? "" : "opacity-0 translate-y-8"}`}>
              {features.map((f, i) => (
                <button
                  key={f.title}
                  onClick={() => setActiveFeature(i)}
                  className={`hover-lift group rounded-2xl border p-6 text-left transition-all ${
                    activeFeature === i
                      ? "border-[#FFC107]/30 bg-[#FFC107]/5 shadow-lg shadow-[#FFC107]/10"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${f.color}15` }}>
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <h4 className="mt-4 font-semibold text-foreground">{f.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{f.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Roles ───── */}
      <section id="roles" className="bg-muted/30 py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div ref={rolesSection.ref} className={`mx-auto max-w-2xl text-center transition-all duration-700 ${rolesSection.visible ? "animate-fade-in-up" : "opacity-0"}`}>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#FF6F00]">Role-Based Access</p>
            <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">Tailored for Every Stakeholder</h2>
            <p className="mt-4 text-muted-foreground">Five distinct roles with purpose-built dashboards, permissions, and workflows.</p>
          </div>

          <div className={`mt-10 grid grid-cols-1 gap-4 sm:mt-16 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 transition-all duration-700 ${rolesSection.visible ? "" : "opacity-0 translate-y-8"}`}>
            {roles.map((role, i) => (
              <div
                key={role.title}
                className="hover-lift group relative overflow-hidden rounded-2xl border border-border bg-card"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`bg-gradient-to-br ${role.gradient} p-6`}>
                  <role.icon className={`h-8 w-8 ${role.dark ? "text-[#1a1a2e]" : "text-white"}`} />
                  <h3 className={`mt-3 text-lg font-bold ${role.dark ? "text-[#1a1a2e]" : "text-white"}`}>{role.title}</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section id="testimonials" className="py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div ref={testimonialsSection.ref} className={`mx-auto max-w-2xl text-center transition-all duration-700 ${testimonialsSection.visible ? "animate-fade-in-up" : "opacity-0"}`}>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#10b981]">Trusted by Industry Leaders</p>
            <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">What Our Users Say</h2>
          </div>

          <div className={`mt-10 grid grid-cols-1 gap-4 sm:mt-16 sm:gap-6 md:grid-cols-3 transition-all duration-700 ${testimonialsSection.visible ? "" : "opacity-0 translate-y-8"}`}>
            {testimonials.map((t) => (
              <div key={t.name} className="hover-lift rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#FFC107] text-[#FFC107]" />
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFC107] to-[#FF6F00] text-sm font-bold text-[#1a1a2e]">
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="py-16 sm:py-24 md:py-32">
        <div ref={ctaSection.ref} className={`mx-auto max-w-4xl px-4 transition-all duration-700 sm:px-6 ${ctaSection.visible ? "animate-scale-in" : "opacity-0"}`}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2332] via-[#2C3E50] to-[#1a2332] p-8 text-center sm:rounded-3xl sm:p-12 md:p-16">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #FFC107 0%, transparent 40%)" }} />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Ready to Transform Your Safety Compliance?</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/60">Join thousands of construction companies managing safety with CSCMS. Get started in minutes.</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8 sm:gap-4">
                <Link
                  href="/register"
                  className="group flex items-center gap-2 rounded-xl bg-[#FFC107] px-8 py-3.5 text-sm font-bold text-[#1a1a2e] transition-all hover:bg-[#ffca2c] hover:shadow-xl hover:shadow-[#FFC107]/30"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Sign In
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-white/40 sm:mt-6 sm:gap-6 sm:text-sm">
                <span className="flex items-center gap-1.5"><Smartphone className="h-4 w-4" /> Web & Mobile Ready</span>
                <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> Enterprise Security</span>
                <span className="flex items-center gap-1.5"><FileBarChart className="h-4 w-4" /> Govt. Audit Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-border bg-card py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFC107]">
                <HardHat className="h-4 w-4 text-[#1a1a2e]" />
              </div>
              <span className="font-bold text-foreground">CSCMS</span>
              <span className="hidden text-sm text-muted-foreground sm:inline">Construction Safety Compliance Management System</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:gap-6">
              <a href="#features" className="transition-colors hover:text-foreground">Features</a>
              <a href="#roles" className="transition-colors hover:text-foreground">Roles</a>
              <Link href="/login" className="transition-colors hover:text-foreground">Sign In</Link>
              <Link href="/register" className="transition-colors hover:text-foreground">Register</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CSCMS. Built for construction safety compliance as per SRS-46 specifications.
          </div>
        </div>
      </footer>
    </div>
  )
}
