"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import { useCscms } from "@/components/cscms-provider"
import { BarChart3, PieChartIcon, TrendingUp, Calendar } from "lucide-react"

const monthlyIncidents = [
  { month: "Sep", incidents: 12, resolved: 10 },
  { month: "Oct", incidents: 19, resolved: 14 },
  { month: "Nov", incidents: 8, resolved: 8 },
  { month: "Dec", incidents: 15, resolved: 12 },
  { month: "Jan", incidents: 11, resolved: 9 },
  { month: "Feb", incidents: 8, resolved: 7 },
]

const complianceData = [
  { name: "Compliant", value: 72, color: "#10b981" },
  { name: "Partial", value: 18, color: "#FFC107" },
  { name: "Non-Compliant", value: 10, color: "#dc2626" },
]

const safetyTrend = [
  { month: "Sep", score: 82, incidents: 12 },
  { month: "Oct", score: 78, incidents: 19 },
  { month: "Nov", score: 88, incidents: 8 },
  { month: "Dec", score: 84, incidents: 15 },
  { month: "Jan", score: 90, incidents: 11 },
  { month: "Feb", score: 94, incidents: 8 },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-xl">
      <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; payload: { color: string } }> }) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-xl">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.payload.color }} />
        <span className="font-semibold text-foreground">{entry.name}</span>
        <span className="text-muted-foreground">{entry.value}%</span>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  icon: Icon,
  iconColor,
  children,
  badge,
}: {
  title: string
  icon: typeof BarChart3
  iconColor: string
  children: React.ReactNode
  badge?: string
}) {
  return (
    <Card className="hover-lift border-border bg-card transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${iconColor}15` }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        <CardTitle className="text-sm font-semibold text-card-foreground">{title}</CardTitle>
        {badge && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function DashboardCharts() {
  const { incidents } = useCscms()
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null)

  const totalIncidents = monthlyIncidents.reduce((sum, m) => sum + m.incidents, 0)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Incidents Bar + Area overlay */}
      <ChartCard title="Monthly Incidents" icon={BarChart3} iconColor="#FF6F00" badge={`${totalIncidents} total`}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyIncidents} barCategoryGap="20%">
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6F00" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#FF6F00" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="barGradResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
            <Bar dataKey="incidents" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="Reported" />
            <Bar dataKey="resolved" fill="url(#barGradResolved)" radius={[6, 6, 0, 0]} name="Resolved" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Compliance Donut */}
      <ChartCard title="Compliance Status" icon={PieChartIcon} iconColor="#10b981" badge={`${complianceData[0].value}% compliant`}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={complianceData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
              onMouseEnter={(_, idx) => setActivePieIndex(idx)}
              onMouseLeave={() => setActivePieIndex(null)}
            >
              {complianceData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.4}
                  className="transition-opacity duration-200"
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />

            {/* Center label */}
            <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
              {complianceData[0].value}%
            </text>
            <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
              Compliant
            </text>
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-center gap-4">
          {complianceData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name}
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Safety Score Area */}
      <ChartCard title="Safety Trend" icon={TrendingUp} iconColor="#FFC107" badge="6 months">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={safetyTrend}>
            <defs>
              <linearGradient id="areaScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFC107" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FFC107" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="areaIncident" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6F00" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FF6F00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#FFC107"
              strokeWidth={2.5}
              fill="url(#areaScore)"
              dot={{ fill: "#FFC107", r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              activeDot={{ r: 6, stroke: "#FFC107", strokeWidth: 2 }}
              name="Safety Score"
            />
            <Area
              type="monotone"
              dataKey="incidents"
              stroke="#FF6F00"
              strokeWidth={2}
              fill="url(#areaIncident)"
              dot={{ fill: "#FF6F00", r: 3, strokeWidth: 2, stroke: "var(--card)" }}
              activeDot={{ r: 5, stroke: "#FF6F00", strokeWidth: 2 }}
              name="Incidents"
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{value}</span>
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
