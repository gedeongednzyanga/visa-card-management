"use client"

import { useState } from "react"
import { Lock, Unlock } from "lucide-react"
import { toast } from "sonner"
import { NetworkLogo, StatusBadge } from "@/components/cards/card-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DataTable, FilterSelect, type Column } from "@/components/shared/data-table"
import { FormField } from "@/components/shared/form-field"
import { StatusPill } from "@/components/shared/status-pill"
import { statusLabels, virtualCards, type VirtualCard } from "@/lib/cards-data"
import { blockHistory, type BlockEvent } from "@/lib/data/operations"
import { cn } from "@/lib/utils"

const reasons = [
  "Suspicion de fraude",
  "Demande du client",
  "Carte compromise",
  "Plafond dépassé",
  "Vérification KYC",
]

export function CardBlockingView() {
  const [cards, setCards] = useState(virtualCards)
  const [history, setHistory] = useState(blockHistory)
  const [blocking, setBlocking] = useState<VirtualCard | null>(null)
  const [reason, setReason] = useState(reasons[0])

  function record(card: VirtualCard, action: BlockEvent["action"], why: string) {
    setCards((prev) =>
      prev.map((c) =>
        c.reference === card.reference ? { ...c, status: action === "blocage" ? "bloquee" : "active" } : c
      )
    )
    setHistory((prev) => [
      {
        id: `BLK-${Date.now()}`,
        date: "20/10/2026 " + new Date().toTimeString().slice(0, 5),
        cardRef: card.reference,
        holder: card.holder,
        last4: card.last4,
        action,
        reason: why,
        by: "Daniel Balinda",
      },
      ...prev,
    ])
  }

  function confirmBlock() {
    if (!blocking) return
    record(blocking, "blocage", reason)
    toast.success(`Carte **** ${blocking.last4} bloquée`, { description: reason })
    setBlocking(null)
  }

  function unblock(card: VirtualCard) {
    record(card, "deblocage", "Vérification effectuée")
    toast.success(`Carte **** ${card.last4} débloquée`)
  }

  const columns: Column<VirtualCard>[] = [
    { header: "Référence", cell: (c) => <span className="text-primary">{c.reference}</span> },
    {
      header: "Client",
      cell: (c) => (
        <>
          <span className="block font-medium">{c.holder}</span>
          <span className="block text-muted-foreground">{c.account}</span>
        </>
      ),
    },
    {
      header: "Carte",
      cell: (c) => (
        <span className="flex items-center gap-2">
          <span className="flex w-6 justify-center">
            <NetworkLogo network={c.network} />
          </span>
          **** {c.last4}
        </span>
      ),
    },
    { header: "Statut", cell: (c) => <StatusBadge status={c.status} className="text-[10.5px]" /> },
    {
      header: "Action",
      className: "text-center",
      cell: (c) =>
        c.status === "bloquee" ? (
          <Button size="xs" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => unblock(c)}>
            <Unlock /> Débloquer
          </Button>
        ) : c.status === "active" ? (
          <Button size="xs" variant="destructive" onClick={() => setBlocking(c)}>
            <Lock /> Bloquer
          </Button>
        ) : (
          <span className="text-muted-foreground">Indisponible</span>
        ),
    },
  ]

  return (
    <div className="grid gap-4 2xl:grid-cols-[1.3fr_1fr]">
      <DataTable
        title="Cartes"
        data={cards}
        columns={columns}
        rowKey={(c) => c.reference}
        itemLabel="cartes"
        exportable={false}
        searchPlaceholder="Rechercher par client, numéro..."
        searchText={(c) => `${c.reference} ${c.holder} ${c.last4} ${c.account}`}
        filters={[
          {
            id: "status",
            allLabel: "Tous les statuts",
            options: Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
            getValue: (c) => c.status,
          },
        ]}
      />

      <Card className="h-fit gap-3 shadow-xs ring-foreground/5">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l pl-5">
            {history.slice(0, 10).map((e) => (
              <li key={e.id} className="relative text-[13px]">
                <span
                  className={cn(
                    "absolute top-1 -left-[27px] size-3.5 rounded-full ring-4 ring-card",
                    e.action === "blocage" ? "bg-red-500" : "bg-emerald-500"
                  )}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={e.action === "blocage" ? "danger" : "success"} className="text-[10.5px]">
                    {e.action === "blocage" ? "Blocage" : "Déblocage"}
                  </StatusPill>
                  <span className="font-medium">
                    {e.holder} · **** {e.last4}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{e.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {e.date} · par {e.by}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Dialog open={!!blocking} onOpenChange={(open) => !open && setBlocking(null)}>
        <DialogContent>
          {blocking && (
            <>
              <DialogHeader>
                <DialogTitle>Bloquer la carte **** {blocking.last4}</DialogTitle>
                <DialogDescription>
                  {blocking.holder} · {blocking.reference}. Toutes les transactions seront refusées jusqu&apos;au déblocage.
                </DialogDescription>
              </DialogHeader>
              <FormField label="Motif">
                <FilterSelect
                  items={reasons.map((r) => ({ value: r, label: r }))}
                  value={reason}
                  onChange={setReason}
                  className="w-full text-sm"
                />
              </FormField>
              <FormField label="Commentaire" htmlFor="comment">
                <Textarea id="comment" placeholder="Détails pour l'équipe risques (optionnel)" />
              </FormField>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
                <Button variant="destructive" className="bg-red-600 text-white hover:bg-red-700" onClick={confirmBlock}>
                  <Lock /> Confirmer le blocage
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
