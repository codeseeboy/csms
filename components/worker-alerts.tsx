"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Award, PackageOpen } from "lucide-react"

const alerts = [
  {
    title: "Expired Certifications",
    count: 2,
    description: "Ana Petrova and Emily Watson have expired certifications",
    icon: Award,
    color: "text-[#dc2626]",
    bg: "bg-[#dc2626]/10",
    borderColor: "border-[#dc2626]/20",
  },
  {
    title: "Workers Without PPE",
    count: 1,
    description: "Emily Watson has no PPE assigned",
    icon: PackageOpen,
    color: "text-[#FF6F00]",
    bg: "bg-[#FF6F00]/10",
    borderColor: "border-[#FF6F00]/20",
  },
  {
    title: "Pending Training",
    count: 4,
    description: "2 workers have overdue training, 2 are in progress",
    icon: AlertTriangle,
    color: "text-[#FFC107]",
    bg: "bg-[#FFC107]/10",
    borderColor: "border-[#FFC107]/20",
  },
]

export function WorkerAlerts() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {alerts.map((alert) => (
        <Card key={alert.title} className={`border ${alert.borderColor} bg-card`}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className={`rounded-lg p-2 ${alert.bg}`}>
              <alert.icon className={`h-5 w-5 ${alert.color}`} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-card-foreground">
                {alert.title}
              </CardTitle>
              <p className={`text-2xl font-bold ${alert.color}`}>{alert.count}</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{alert.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
