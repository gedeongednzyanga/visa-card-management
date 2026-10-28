"use client"

import { useState } from "react"
import { AlertOctagon, BellRing, CheckCircle2, MoreHorizontal, ShieldQuestion } from "lucide-react"
import { toast } from "sonner"
import { ActivityChart } from "@/components/charts/activity-chart"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, type Column } from "@/components/shared/data-table"
import { AlertStatusPill, SeverityPill } from "@/components/shared/pills"
import { StatGrid } from "@/components/shared/stat-card"
import {
  alertStatusLabels,
  riskAlerts,
  riskByRule,
  severityLabels,
  type AlertStatus,
  type RiskAlert,
} from "@/lib/data/operations"
import { cn } from "@/lib/utils"

function ScoreBar({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "block h-full rounded-full",
            score >= 90 ? "bg-red-500" : score >= 75 ? "bg-orange-500" : score >= 55 ? "bg-purple-500" : "bg-slate-400"
          )}
          style={{ width: `${score}%` }}
        />
      </span>
      <span className="tabular-nums">{score}</span>
    </span>
  )
}

export function RiskAlertsView() {
  const [alerts, setAlerts] = useState(riskAlerts)

  function setStatus(alert: RiskAlert, status: AlertStatus) {
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, status } : a)))
    toast.success(`Alerte ${alert.id} : ${alertStatusLabels[status].toLowerCase()}`)
  }

  const open = alerts.filter((a) => a.status === "nouvelle" || a.status === "en-cours")
  const resolved = alerts.filter((a) => a.status === "resolue" || a.status === "faux-positif")

  const columns: Column<RiskAlert>[] = [
    { header: "ID", cell: (a) => <span className="text-primary">{a.id}</span> },
    { header: "Date", cell: (a) => a.date },
    {
      header: "Client",
      cell: (a) => (
        <>
          <span className="block font-medium">{a.client}</span>
          <span className="block text-muted-foreground">{a.target}</span>
        </>
      ),
    },
    { header: "Règle déclenchée", cell: (a) => a.rule },
    { header: "Montant", cell: (a) => a.amount },
    { header: "Score", cell: (a) => <ScoreBar score={a.score} /> },
    { header: "Sévérité", cell: (a) => <SeverityPill value={a.severity} className="text-[10.5px]" /> },
    { header: "Statut", cell: (a) => <AlertStatusPill value={a.status} className="text-[10.5px]" /> },
    {
      header: "Actions",
      className: "text-center",
      cell: (a) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="icon-sm" className="h-6 w-8" aria-label={`Actions pour ${a.id}`} />}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled={a.status === "en-cours"} onClick={() => setStatus(a, "en-cours")}>
              Prendre en charge
            </DropdownMenuItem>
            <DropdownMenuItem disabled={a.status === "resolue"} onClick={() => setStatus(a, "resolue")}>
              Marquer comme résolue
            </DropdownMenuItem>
            <DropdownMenuItem disabled={a.status === "faux-positif"} onClick={() => setStatus(a, "faux-positif")}>
              Faux positif
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setStatus(a, "resolue")
                toast.warning(`${a.target} bloquée`)
              }}
            >
              Bloquer la carte
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      <StatGrid
        stats={[
          { label: "Alertes ouvertes", value: String(open.length), icon: BellRing, tone: "warning", caption: "Nouvelles ou en cours" },
          { label: "Critiques", value: String(open.filter((a) => a.severity === "critique").length), icon: AlertOctagon, tone: "danger", caption: "Score ≥ 90, à traiter en priorité" },
          { label: "Traitées", value: String(resolved.length), icon: CheckCircle2, tone: "success", caption: "Sur les 10 derniers jours" },
          {
            label: "Faux positifs",
            value: `${resolved.length ? Math.round((alerts.filter((a) => a.status === "faux-positif").length / resolved.length) * 100) : 0}%`,
            icon: ShieldQuestion,
            tone: "neutral",
            caption: "Des alertes traitées",
          },
        ]}
      />

      <ActivityChart
        title="Alertes par règle"
        subtitle="(10 derniers jours)"
        variant="bar"
        height={200}
        data={riskByRule}
        xKey="rule"
        series={[{ key: "count", label: "Alertes", color: "var(--chart-2)" }]}
      />

      <DataTable
        title="Alertes de fraude"
        data={alerts}
        columns={columns}
        rowKey={(a) => a.id}
        itemLabel="alertes"
        searchPlaceholder="Rechercher par client, carte, ID..."
        searchText={(a) => `${a.id} ${a.client} ${a.target} ${a.rule}`}
        filters={[
          {
            id: "severity",
            allLabel: "Toutes les sévérités",
            options: Object.entries(severityLabels).map(([value, label]) => ({ value, label })),
            getValue: (a) => a.severity,
          },
          {
            id: "status",
            allLabel: "Tous les statuts",
            options: Object.entries(alertStatusLabels).map(([value, label]) => ({ value, label })),
            getValue: (a) => a.status,
          },
        ]}
      />
    </>
  )
}
