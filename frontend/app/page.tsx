import React from "react";
import {
  FileText, Cpu, FolderOpen, Calculator, UserCheck, ShieldCheck,
  AlertTriangle, TrendingUp, Clock, DollarSign,
} from "lucide-react";
import {
  Card, CardHeader, CardTitle, CardContent, StatCard,
  Badge, StatusBadge,
  Progress,
  Alert,
  Timeline, type TimelineItem,
  Button,
} from "@/components/ui";

const timelineItems: TimelineItem[] = [
  { id: "1", title: "Claim Submitted",         description: "Policy #POL-2024-0918 — Auto Collision",         status: "completed", timestamp: "09:14 AM" },
  { id: "2", title: "AI Intake Validation",    description: "Documents verified, coverage confirmed",           status: "completed", timestamp: "09:15 AM" },
  { id: "3", title: "Fraud Analysis Running",  description: "Agent swarm cross-referencing records",            status: "active",    timestamp: "09:22 AM" },
  { id: "4", title: "Damage Assessment",       description: "Pending completion of investigation",              status: "pending",   timestamp: "" },
  { id: "5", title: "Adjuster Review",         description: "Human-in-the-loop approval gate",                  status: "pending",   timestamp: "" },
];

const modules = [
  { title: "Claims Queue",        desc: "Claim intake, lifecycle management, and policyholder verification.",     icon: FileText,    badge: "Ready",     badgeVariant: "primary" as const },
  { title: "AI Investigation",    desc: "Multi-agent fraud detection, inconsistency analysis, policy checking.",  icon: Cpu,         badge: "Backend",   badgeVariant: "info" as const },
  { title: "Evidence Vault",      desc: "Multimodal document ingestion, OCR extraction, and RAG retrieval.",      icon: FolderOpen,  badge: "RAG Ready", badgeVariant: "primary" as const },
  { title: "Loss Assessment",     desc: "Itemized damage repair estimation, deductible application, payouts.",    icon: Calculator,  badge: "Engine",    badgeVariant: "action" as const },
  { title: "Review & Approval",   desc: "Human-in-the-loop decision panel, overrides, and audit trails.",         icon: UserCheck,   badge: "HITL Gate", badgeVariant: "success" as const },
  { title: "Architecture",        desc: "Frontend communicates exclusively via HTTP APIs to backend :5000.",      icon: ShieldCheck, badge: "Decoupled", badgeVariant: "outline" as const },
];

export default function HomePage() {
  return (
    <div className="space-y-8 page-enter">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Claims Intelligence Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            Enterprise AI platform — design system foundation complete.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status="online" />
          <Button variant="action" size="sm" leftIcon={<FileText className="h-4 w-4" />}>
            New Claim
          </Button>
        </div>
      </div>

      {/* Alert banner */}
      <Alert
        variant="warning"
        title="Design System Active"
        description="All UI components are initialized. No business logic has been implemented yet — this is the foundation layer."
      />

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open Claims"
          value="247"
          delta="+12 this week"
          deltaType="neutral"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="Avg. Resolution"
          value="4.2d"
          delta="−0.8d vs. last month"
          deltaType="positive"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Fraud Detected"
          value="18"
          delta="↑ 3 flagged"
          deltaType="negative"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Total Assessed"
          value="$2.4M"
          delta="+$340K pending"
          deltaType="neutral"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Module grid + timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card key={mod.title} className="hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer">
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className="p-2 rounded-[var(--radius-lg)]"
                      style={{ background: "var(--green-50)", color: "var(--green-600)" }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge variant={mod.badgeVariant} size="sm">{mod.badge}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {mod.title}
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                    {mod.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Claim activity timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Claim Activity</CardTitle>
            <StatusBadge status="under_investigation" size="sm" />
          </CardHeader>
          <CardContent className="pb-5">
            <div className="mb-5 space-y-2">
              <Progress
                value={60}
                label="Processing Progress"
                showValue
                variant="primary"
              />
              <Progress value={30} label="Evidence Collected" showValue variant="action" />
            </div>
            <Timeline items={timelineItems} />
          </CardContent>
        </Card>
      </div>

      {/* Badge showcase */}
      <Card>
        <CardHeader borderless>
          <CardTitle>Design System — Badge & Status Tokens</CardTitle>
          <TrendingUp className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Semantic Badges</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary" dot>Primary</Badge>
              <Badge variant="action" dot>Action / Amber</Badge>
              <Badge variant="success" dot>Success</Badge>
              <Badge variant="warning" dot>Warning</Badge>
              <Badge variant="error" dot>Error</Badge>
              <Badge variant="info" dot>Info</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Claim Status Badges</p>
            <div className="flex flex-wrap gap-2">
              {(["draft","submitted","under_investigation","assessment_pending","review_required","approved","rejected","escalated"] as const).map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Button Variants</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary"   size="sm">Primary</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="action"    size="sm">Action</Button>
              <Button variant="outline"   size="sm">Outline</Button>
              <Button variant="ghost"     size="sm">Ghost</Button>
              <Button variant="danger"    size="sm">Danger</Button>
              <Button variant="primary"   size="sm" isLoading>Loading</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
