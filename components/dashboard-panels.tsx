"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  Clock,
  Award,
  PackageOpen,
  ClipboardList,
} from "lucide-react"

const recentIncidents = [
  {
    id: "INC-2024-042",
    location: "Building A - Floor 3",
    severity: "High",
    status: "Open",
  },
  {
    id: "INC-2024-041",
    location: "Site B - Parking Lot",
    severity: "Medium",
    status: "Under Review",
  },
  {
    id: "INC-2024-040",
    location: "Building C - Basement",
    severity: "Low",
    status: "Resolved",
  },
  {
    id: "INC-2024-039",
    location: "Site A - Roof",
    severity: "Critical",
    status: "Open",
  },
  {
    id: "INC-2024-038",
    location: "Building B - Floor 1",
    severity: "Medium",
    status: "Resolved",
  },
]

const complianceAlerts = [
  {
    type: "Overdue Inspection",
    description: "Building A fire safety inspection overdue by 5 days",
    icon: Clock,
    urgency: "high",
  },
  {
    type: "Expiring Certification",
    description: "12 workers have certifications expiring within 30 days",
    icon: Award,
    urgency: "medium",
  },
  {
    type: "Low PPE Stock",
    description: "Hard hats and safety goggles below minimum threshold",
    icon: PackageOpen,
    urgency: "high",
  },
  {
    type: "Pending Action",
    description: "3 corrective actions from last audit still pending",
    icon: ClipboardList,
    urgency: "medium",
  },
]

function getSeverityColor(severity: string) {
  switch (severity) {
    case "Critical":
      return "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20"
    case "High":
      return "bg-[#FF6F00]/10 text-[#FF6F00] border-[#FF6F00]/20"
    case "Medium":
      return "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20"
    case "Low":
      return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Open":
      return "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20"
    case "Under Review":
      return "bg-[#FFC107]/10 text-[#b08c00] border-[#FFC107]/20"
    case "Resolved":
      return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function DashboardPanels() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Recent Incidents */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <AlertTriangle className="h-5 w-5 text-[#FF6F00]" />
          <CardTitle className="text-sm font-semibold text-card-foreground">
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentIncidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-card-foreground">
                      {incident.id}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${getSeverityColor(incident.severity)}`}
                    >
                      {incident.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {incident.location}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${getStatusColor(incident.status)}`}
                >
                  {incident.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <AlertTriangle className="h-5 w-5 text-[#dc2626]" />
          <CardTitle className="text-sm font-semibold text-card-foreground">
            Compliance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceAlerts.map((alert) => (
              <div
                key={alert.type}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  alert.urgency === "high"
                    ? "border-[#dc2626]/20 bg-[#dc2626]/5"
                    : "border-[#FFC107]/20 bg-[#FFC107]/5"
                }`}
              >
                <div
                  className={`rounded-lg p-2 ${
                    alert.urgency === "high"
                      ? "bg-[#dc2626]/10"
                      : "bg-[#FFC107]/10"
                  }`}
                >
                  <alert.icon
                    className={`h-4 w-4 ${
                      alert.urgency === "high"
                        ? "text-[#dc2626]"
                        : "text-[#b08c00]"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-card-foreground">
                    {alert.type}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
