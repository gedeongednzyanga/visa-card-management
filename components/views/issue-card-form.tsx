"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { NetworkLogo } from "@/components/cards/card-badges"
import { VirtualCardVisual } from "@/components/cards/virtual-card-visual"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { FilterSelect } from "@/components/shared/data-table"
import { FormField } from "@/components/shared/form-field"
import { networkLabels, type CardNetwork, type VirtualCard } from "@/lib/cards-data"
import { accounts, accountTypeLabels, clients } from "@/lib/data/clients"
import { formatAmount } from "@/lib/format"
import { cn } from "@/lib/utils"

const verified = new Set(clients.filter((c) => c.kyc === "verifie" && c.active).map((c) => c.id))
const eligibleAccounts = accounts.filter((a) => a.status === "actif" && verified.has(a.clientId))

const options = [
  { id: "online", label: "Paiements en ligne", description: "Achats sur les sites marchands" },
  { id: "international", label: "Transactions internationales", description: "Marchands hors RDC" },
  { id: "secure", label: "3-D Secure", description: "Confirmation par OTP à chaque paiement" },
  { id: "subscriptions", label: "Abonnements récurrents", description: "Netflix, Spotify, services cloud..." },
] as const

export function IssueCardForm() {
  const router = useRouter()
  const [accountNumber, setAccountNumber] = useState(eligibleAccounts[0].number)
  const [network, setNetwork] = useState<CardNetwork>("visa")
  const [validity, setValidity] = useState("3")
  const [monthlyLimit, setMonthlyLimit] = useState("5000")
  const [perTx, setPerTx] = useState("1000")
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    online: true,
    international: true,
    secure: true,
    subscriptions: false,
  })

  const account = eligibleAccounts.find((a) => a.number === accountNumber)!
  const expires = `20/10/${2026 + Number(validity)}`
  const limitError = Number(perTx) > Number(monthlyLimit)

  const preview: VirtualCard = {
    reference: "VC-20261020-NEW",
    holder: account.holder,
    account: account.number,
    last4: "••••",
    network,
    currency: account.currency,
    status: "en-attente",
    issuedAt: "20/10/2026",
    expiresAt: expires,
    monthlyLimit: Number(monthlyLimit),
    monthlySpent: 0,
    perTransactionLimit: Number(perTx),
    transactionCount: 0,
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (limitError) {
      toast.error("Le plafond par transaction dépasse le plafond mensuel")
      return
    }
    toast.success(`Carte ${networkLabels[network]} émise pour ${account.holder}`, {
      description: "Les données de la carte ont été envoyées au client par SMS sécurisé.",
    })
    router.push("/cartes-virtuelles")
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Compte à débiter</CardTitle>
            <CardDescription>Comptes actifs de clients au KYC vérifié.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField label="Compte lié" className="sm:col-span-2">
              <FilterSelect
                items={eligibleAccounts.map((a) => ({
                  value: a.number,
                  label: `${a.number} — ${a.holder} (${a.currency})`,
                }))}
                value={accountNumber}
                onChange={setAccountNumber}
                className="w-full text-sm"
              />
            </FormField>
            <div className="rounded-lg bg-muted/50 p-3 text-[13px] sm:col-span-2">
              <span className="text-muted-foreground">{accountTypeLabels[account.type]} · </span>
              Solde disponible :{" "}
              <span className="font-semibold">{formatAmount(account.balance, account.currency)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Carte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={network}
              onValueChange={(v) => setNetwork(v as CardNetwork)}
              className="grid gap-3 sm:grid-cols-2"
            >
              {(["visa", "mastercard"] as const).map((n) => (
                <Label
                  key={n}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal",
                    network === n && "border-primary bg-primary/5"
                  )}
                >
                  <RadioGroupItem value={n} />
                  <NetworkLogo network={n} />
                  <span className="font-medium">{networkLabels[n]}</span>
                </Label>
              ))}
            </RadioGroup>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label={`Plafond mensuel (${account.currency})`} htmlFor="monthly">
                <Input id="monthly" type="number" min={1} value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} required />
              </FormField>
              <FormField
                label={`Plafond par transaction (${account.currency})`}
                htmlFor="pertx"
                hint={limitError ? "Doit être inférieur au plafond mensuel" : undefined}
              >
                <Input id="pertx" type="number" min={1} value={perTx} onChange={(e) => setPerTx(e.target.value)} aria-invalid={limitError} required />
              </FormField>
              <FormField label="Validité">
                <FilterSelect
                  items={[{ value: "1", label: "1 an" }, { value: "2", label: "2 ans" }, { value: "3", label: "3 ans" }]}
                  value={validity}
                  onChange={setValidity}
                  className="w-full text-sm"
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Options de sécurité</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {options.map((o) => (
              <Label key={o.id} className="flex items-center justify-between gap-4 rounded-lg border p-3 font-normal">
                <span>
                  <span className="block font-medium">{o.label}</span>
                  <span className="block text-xs text-muted-foreground">{o.description}</span>
                </span>
                <Switch
                  checked={enabled[o.id]}
                  onCheckedChange={(v) => setEnabled((prev) => ({ ...prev, [o.id]: v }))}
                />
              </Label>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-[76px] xl:h-fit">
        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Aperçu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <VirtualCardVisual card={preview} />
            <dl className="space-y-2 text-[13px]">
              {[
                ["Titulaire", account.holder],
                ["Devise", account.currency],
                ["Expiration", expires],
                ["Plafond mensuel", formatAmount(Number(monthlyLimit) || 0, account.currency)],
                ["Par transaction", formatAmount(Number(perTx) || 0, account.currency)],
                ["Frais d'émission", "5 USD"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <Button type="submit" className="h-10 w-full">
              Émettre la carte
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
