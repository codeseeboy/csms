"use client"

import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  ShieldCheck,
  Award,
  PackageOpen,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface KpiCardData {
  label: string
  value: string
  icon: React.ElementType
  trend: "up" | "down"
  trendValue: string
  iconBg: string
  iconColor: string
}

const kpiData: KpiCardData[] = [
  {
    label: "Total Workers",
    value: "1,248",
    icon: Users,
    trend: "up",
    trendValue: "+12%",
    iconBg: "bg-[#FFC107]/15",
    iconColor: "text-[#FFC107]",
  },
  {
    label: "Active Inspections",
    value: "34",
    icon: ClipboardCheck,
    trend: "up",
    trendValue: "+5",
    iconBg: "bg-[#2C3E50]/10",
    iconColor: "text-[#2C3E50]",
  },
  {
    label: "Open Incidents",
    value: "8",
    icon: AlertTriangle,
    trend: "down",
    trendValue: "-3",
    iconBg: "bg-[#dc2626]/10",
    iconColor: "text-[#dc2626]",
  },
  {
    label: "Compliance Rate",
    value: "94.2%",
    icon: ShieldCheck,
    trend: "up",
    trendValue: "+2.1%",
    iconBg: "bg-[#10b981]/10",
    iconColor: "text-[#10b981]",
  },
  {
    label: "Expiring Certs",
    value: "15",
    icon: Award,
    trend: "up",
    trendValue: "+4",
    iconBg: "bg-[#FF6F00]/10",
    iconColor: "text-[#FF6F00]",
  },
  {
    label: "Low PPE Stock",
    value: "6",
    icon: PackageOpen,
    trend: "down",
    trendValue: "-2",
    iconBg: "bg-[#6366f1]/10",
    iconColor: "text-[#6366f1]",
  },
]

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpiData.map((kpi) => (
        <Card key={kpi.label} className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${kpi.iconBg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-semibold ${
                  kpi.label === "Open Incidents" || kpi.label === "Expiring Certs"
                    ? kpi.trend === "down"
                      ? "text-[#10b981]"
                      : "text-[#dc2626]"
                    : kpi.trend === "up"
                      ? "text-[#10b981]"
                      : "text-[#dc2626]"
                }`}
              >
                {kpi.trend === "up" ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {kpi.trendValue}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-card-foreground">
                {kpi.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {kpi.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
