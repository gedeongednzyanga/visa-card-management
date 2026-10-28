"use client"

import { useState } from "react"
import { Check, CheckCircle2, Clock, FileText, X, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { NetworkLogo } from "@/components/cards/card-badges"
import { DataTable, type Column } from "@/components/shared/data-table"
import { RequestStatusPill } from "@/components/shared/pills"
import { StatGrid } from "@/components/shared/stat-card"
import { networkLabels } from "@/lib/cards-data"
import {
  cardRequests as initialRequests,
  requestStatusLabels,
  type CardRequest,
  type RequestStatus,
} from "@/lib/data/operations"
import { formatAmount } from "@/lib/format"

export function CardRequestsView() {
  const [requests, setRequests] = useState(initialRequests)

  function decide(request: CardRequest, status: RequestStatus) {
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status } : r)))
    if (status === "approuvee") {
      toast.success(`Demande ${request.id} approuvée`, {
        description: `La carte de ${request.client} passe en émission.`,
      })
    } else {
      toast.error(`Demande ${request.id} rejetée`)
    }
  }

  const count = (s: RequestStatus) => requests.filter((r) => r.status === s).length

  const columns: Column<CardRequest>[] = [
    { header: "N° demande", cell: (r) => <span className="text-primary">{r.id}</span> },
    {
      header: "Client",
      cell: (r) => (
        <>
          <span className="block font-medium">{r.client}</span>
          <span className="block text-muted-foreground">{r.account}</span>
        </>
      ),
    },
    {
      header: "Type",
      cell: (r) => (
        <span className="flex items-center gap-2">
          <span className="flex w-6 justify-center">
            <NetworkLogo network={r.network} />
          </span>
          {networkLabels[r.network]}
        </span>
      ),
    },
    { header: "Plafond demandé", cell: (r) => formatAmount(r.monthlyLimit, r.currency) },
    { header: "Canal", cell: (r) => r.channel },
    { header: "Agent", cell: (r) => r.agent },
    { header: "Date", cell: (r) => r.requestedAt },
    { header: "Statut", cell: (r) => <RequestStatusPill value={r.status} className="text-[10.5px]" /> },
    {
      header: "Décision",
      className: "text-center",
      cell: (r) =>
        r.status === "en-attente" ? (
          <span className="flex justify-center gap-1">
            <Button
              size="xs"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => decide(r, "approuvee")}
            >
              <Check /> Approuver
            </Button>
            <Button size="xs" variant="destructive" onClick={() => decide(r, "rejetee")}>
              <X /> Rejeter
            </Button>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <>
      <StatGrid
        stats={[
          { label: "Demandes reçues", value: String(requests.length), icon: FileText, tone: "info", caption: "Sur les 14 derniers jours" },
          { label: "En attente", value: String(count("en-attente")), icon: Clock, tone: "warning", caption: "À valider par un superviseur" },
          { label: "Approuvées", value: String(count("approuvee")), icon: CheckCircle2, tone: "success", caption: "Envoyées en émission" },
          { label: "Rejetées", value: String(count("rejetee")), icon: XCircle, tone: "danger", caption: "Dossiers incomplets ou refusés" },
        ]}
      />
      <DataTable
        title="Demandes de carte"
        data={requests}
        columns={columns}
        rowKey={(r) => r.id}
        itemLabel="demandes"
        searchPlaceholder="Rechercher par client, compte, n° de demande..."
        searchText={(r) => `${r.id} ${r.client} ${r.account}`}
        filters={[
          {
            id: "status",
            allLabel: "Tous les statuts",
            options: Object.entries(requestStatusLabels).map(([value, label]) => ({ value, label })),
            getValue: (r) => r.status,
          },
          {
            id: "network",
            allLabel: "Tous les types",
            options: Object.entries(networkLabels).map(([value, label]) => ({ value, label })),
            getValue: (r) => r.network,
          },
        ]}
      />
    </>
  )
}
