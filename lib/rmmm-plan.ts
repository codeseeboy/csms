export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export type RmmmRisk = {
  id: string
  title: string
  description: string
  probability: RiskLevel
  impact: RiskLevel
  proactiveMitigation: string
  reactiveManagement: string
}

export const rmmmRisks: RmmmRisk[] = [
  {
    id: 'R1',
    title: 'Technical Complexity Risk',
    description:
      'The system includes multiple integrated modules such as authentication, RBAC, inspections, incident reporting, PPE tracking, and analytics. Underestimating this complexity can cause integration failures or delayed delivery.',
    probability: 'High',
    impact: 'High',
    proactiveMitigation:
      'Use a modular development approach with Next.js App Router. Use stable open source libraries (shadcn/ui, Recharts, Zod), perform regular architecture reviews and code walkthroughs, and enforce TypeScript type safety across modules.',
    reactiveManagement:
      'Split development into smaller independent sprints and prioritize core modules first (auth, dashboard, worker management). Assign a senior developer for integration checkpoints and re-scope non-critical features such as AI and IoT to later releases if needed.',
  },
  {
    id: 'R2',
    title: 'Data Privacy and Security Risk',
    description:
      'CSCMS stores sensitive worker information including certifications, contacts, and incident records. A breach can expose personal data, reduce trust, and trigger legal penalties.',
    probability: 'Medium',
    impact: 'Critical',
    proactiveMitigation:
      'Implement end-to-end encryption (HTTPS, TLS), strict RBAC, and JWT sessions with expiry. Run regular security audits and penetration tests. Store uploaded files in secure cloud storage using IAM policies.',
    reactiveManagement:
      'Immediately revoke compromised credentials, notify affected users, and activate incident response procedures. Engage a security specialist for forensic analysis, restore from encrypted backups, and report as required by data protection laws.',
  },
  {
    id: 'R3',
    title: 'Third-Party API Integration Risk',
    description:
      'The system depends on external APIs for notifications, cloud file storage, and analytics. API downtime, deprecations, or pricing changes can impact core functions.',
    probability: 'Medium',
    impact: 'High',
    proactiveMitigation:
      'Select stable providers (for example Twilio, SendGrid, AWS). Build API abstraction layers so providers can be swapped. Monitor API health and subscribe to provider change notifications.',
    reactiveManagement:
      'Switch providers through the abstraction layer, enable fallback modes such as in-app notifications when SMS or email fails, show clear degraded-service messages, and use cached last-known responses when possible.',
  },
  {
    id: 'R4',
    title: 'User Adoption Risk',
    description:
      'Field workers and inspectors may resist digital workflows and stay with paper processes. Low adoption reduces safety impact and expected ROI.',
    probability: 'High',
    impact: 'High',
    proactiveMitigation:
      'Design an intuitive mobile-responsive UI with clear dashboards and color-coded statuses. Run role-based training sessions, provide multilingual support and form tooltips, and pilot with a smaller user group for early feedback.',
    reactiveManagement:
      'Provide helpdesk support, short tutorials, and user manuals. Identify onsite champions to drive peer adoption, simplify UI based on field feedback, and use incentives for early adopters.',
  },
  {
    id: 'R5',
    title: 'Schedule Delay Risk',
    description:
      'The timeline can slip because of scope creep, team availability issues, underestimated complexity, or regulatory change dependencies.',
    probability: 'Medium',
    impact: 'High',
    proactiveMitigation:
      'Set clear scope with formal change control in the SRS. Use two-week Agile sprints and weekly Gantt reviews. Keep a 10 percent schedule buffer and identify backup resources for team continuity.',
    reactiveManagement:
      'Re-prioritize deliverables and defer lower-priority features such as AI prediction and IoT integration. Add effort on critical path tasks, escalate blockers quickly, and augment temporary capacity when required.',
  },
  {
    id: 'R6',
    title: 'Regulatory and Compliance Risk',
    description:
      'Construction safety regulations can change during development. If updates are not reflected, the system can become non-compliant.',
    probability: 'Low',
    impact: 'Critical',
    proactiveMitigation:
      'Engage compliance or legal review early. Design compliance modules to be configurable so updates do not require full redevelopment. Track regulatory announcements continuously.',
    reactiveManagement:
      'Assess change impact immediately, schedule an emergency sprint for required compliance updates, revise audit templates and checklists, and communicate changes to all stakeholders.',
  },
  {
    id: 'R7',
    title: 'Infrastructure and Hosting Risk',
    description:
      'Cloud downtime, database crashes, or network outages can make CSCMS unavailable during critical safety reporting periods.',
    probability: 'Low',
    impact: 'High',
    proactiveMitigation:
      'Deploy on reliable cloud infrastructure with uptime SLA, configure automated daily and weekly backups, and set health monitoring and alerting with scaling and load balancing.',
    reactiveManagement:
      'Trigger failover deployment or secondary region, restore from latest backup, notify users with recovery ETA, and offer an emergency offline reporting form during outages.',
  },
  {
    id: 'R8',
    title: 'Data Integrity and Accuracy Risk',
    description:
      'Incorrect entries such as wrong incident details, PPE records, or certification dates can distort safety analytics and compliance decisions.',
    probability: 'Medium',
    impact: 'High',
    proactiveMitigation:
      'Use strict form validation with Zod (required fields, type checks, date constraints), confirmation dialogs for critical actions, field-level constraints, periodic data quality reviews, and supervisor approval for high-impact submissions.',
    reactiveManagement:
      'Automatically flag anomalous records, allow authorized supervisors to correct entries with full audit logs, notify original submitters, and preserve immutable history for accountability.',
  },
]

export const rmmmConclusion =
  'The RMMM plan for CSCMS addresses eight major risks across technical delivery, security, integration, adoption, schedule, compliance, infrastructure, and data quality. Combining proactive prevention with reactive contingency improves reliability, trust, and long-term compliance value for all stakeholders.'
