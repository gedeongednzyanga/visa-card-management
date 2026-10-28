"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { NetworkLogo, StatusBadge } from "@/components/cards/card-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { DataTable, type Column } from "@/components/shared/data-table"
import { FormField } from "@/components/shared/form-field"
import { virtualCards, type VirtualCard } from "@/lib/cards-data"
import { formatAmount } from "@/lib/format"
import { cn } from "@/lib/utils"

const profiles = [
  { name: "Standard", monthly: 2000, perTx: 500, daily: 5, description: "Particuliers, nouveaux clients" },
  { name: "Premium", monthly: 10000, perTx: 2500, daily: 15, description: "Particuliers avec historique > 6 mois" },
  { name: "Entreprise", monthly: 25000, perTx: 5000, daily: 40, description: "Personnes morales vérifiées" },
]

function usage(card: VirtualCard) {
  return card.monthlyLimit ? Math.round((card.monthlySpent / card.monthlyLimit) * 1000) / 10 : 0
}

export function CardLimitsView() {
  const [cards, setCards] = useState(virtualCards)
  const [editing, setEditing] = useState<VirtualCard | null>(null)

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const form = new FormData(e.currentTarget)
    const monthlyLimit = Number(form.get("monthly"))
    const perTransactionLimit = Number(form.get("pertx"))
    if (perTransactionLimit > monthlyLimit) {
      toast.error("Le plafond par transaction dépasse le plafond mensuel")
      return
    }
    setCards((prev) =>
      prev.map((c) => (c.reference === editing.reference ? { ...c, monthlyLimit, perTransactionLimit } : c))
    )
    toast.success(`Plafonds de ${editing.reference} mis à jour`)
    setEditing(null)
  }

  const columns: Column<VirtualCard>[] = [
    { header: "Référence", cell: (c) => <span className="text-primary">{c.reference}</span> },
    {
      header: "Carte",
      cell: (c) => (
        <span className="flex items-center gap-2">
          <span className="flex w-6 justify-center">
            <NetworkLogo network={c.network} />
          </span>
          <span>
            <span className="block font-medium">{c.holder}</span>
            <span className="block text-muted-foreground">**** {c.last4}</span>
          </span>
        </span>
      ),
    },
    { header: "Statut", cell: (c) => <StatusBadge status={c.status} className="text-[10.5px]" /> },
    { header: "Plafond mensuel", cell: (c) => formatAmount(c.monthlyLimit, c.currency) },
    { header: "Dépensé", cell: (c) => formatAmount(c.monthlySpent, c.currency) },
    {
      header: "Utilisation",
      className: "w-[180px]",
      cell: (c) => {
        const rate = usage(c)
        return (
          <span className="flex items-center gap-2">
            <Progress
              value={Math.min(rate, 100)}
              className={cn(
                "flex-1 [&_[data-slot=progress-track]]:h-1.5",
                rate >= 90 && "[&_[data-slot=progress-indicator]]:bg-red-500",
                rate >= 70 && rate < 90 && "[&_[data-slot=progress-indicator]]:bg-orange-500"
              )}
            />
            <span className="w-10 text-right tabular-nums">{rate}%</span>
          </span>
        )
      },
    },
    { header: "Par transaction", cell: (c) => formatAmount(c.perTransactionLimit, c.currency) },
    {
      header: "Actions",
      className: "text-center",
      cell: (c) => (
        <Button variant="outline" size="xs" onClick={() => setEditing(c)}>
          <Pencil /> Modifier
        </Button>
      ),
    },
  ]

  return (
    <>
      <Card className="shadow-xs ring-foreground/5">
        <CardHeader>
          <CardTitle className="font-semibold">Profils de plafonds</CardTitle>
          <CardDescription>Valeurs appliquées par défaut à l&apos;émission d&apos;une carte (en USD).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {profiles.map((p) => (
            <div key={p.name} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{p.name}</p>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Modifier le profil ${p.name}`}
                  onClick={() => toast.info(`Modification du profil ${p.name}`)}
                >
                  <Pencil />
                </Button>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">{p.description}</p>
              <dl className="space-y-1 text-[13px]">
                <div className="flex justify-between"><dt className="text-muted-foreground">Mensuel</dt><dd className="font-medium">{formatAmount(p.monthly, "USD")}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Par transaction</dt><dd className="font-medium">{formatAmount(p.perTx, "USD")}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Transactions / jour</dt><dd className="font-medium">{p.daily}</dd></div>
              </dl>
            </div>
          ))}
        </CardContent>
      </Card>

      <DataTable
        title="Plafonds par carte"
        data={cards}
        columns={columns}
        rowKey={(c) => c.reference}
        itemLabel="cartes"
        searchPlaceholder="Rechercher par client, référence..."
        searchText={(c) => `${c.reference} ${c.holder} ${c.last4}`}
        filters={[
          {
            id: "usage",
            allLabel: "Toutes les utilisations",
            options: [
              { value: "high", label: "≥ 70 % utilisé" },
              { value: "low", label: "< 70 % utilisé" },
            ],
            getValue: (c) => (usage(c) >= 70 ? "high" : "low"),
          },
        ]}
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          {editing && (
            <form onSubmit={handleSave} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Modifier les plafonds</DialogTitle>
                <DialogDescription>
                  {editing.reference} · {editing.holder} · **** {editing.last4}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={`Plafond mensuel (${editing.currency})`} htmlFor="monthly">
                  <Input id="monthly" name="monthly" type="number" min={1} defaultValue={editing.monthlyLimit} required />
                </FormField>
                <FormField label={`Par transaction (${editing.currency})`} htmlFor="pertx">
                  <Input id="pertx" name="pertx" type="number" min={1} defaultValue={editing.perTransactionLimit} required />
                </FormField>
              </div>
              <p className="text-xs text-muted-foreground">
                Montant déjà dépensé ce mois : {formatAmount(editing.monthlySpent, editing.currency)}
              </p>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>Annuler</DialogClose>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
