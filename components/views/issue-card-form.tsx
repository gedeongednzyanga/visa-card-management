"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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
import { createIdempotencyKey } from "@/lib/idempotency"
import { kardpayErrorMessage } from "@/lib/kardpay/error-messages"
import { isKardPaySupported, networkLabels, type CardNetwork, type VirtualCard } from "@/lib/cards-data"
import { accounts, accountTypeLabels, clients } from "@/lib/data/clients"
import { formatAmount } from "@/lib/format"
import { cn } from "@/lib/utils"

// Réponse de POST /api/cards (relais de POST /partner/v1/cards, section 10.3).
type IssueCardResponse = { status?: "pending" | "awaiting_funds" | "active"; id?: string }

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
  const [submitting, setSubmitting] = useState(false)
  // Une seule clé par intention d'émission : créée au premier clic, réutilisée
  // sur un nouveau clic tant que la soumission précédente n'a pas réussi
  // (doc KardPay section 6.4 — jamais régénérée pour une relance de la MÊME action).
  const idemKeyRef = useRef<string | null>(null)

  const account = eligibleAccounts.find((a) => a.number === accountNumber)!
  const client = clients.find((c) => c.id === account.clientId)!
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
    kardpayCardId: null,
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (limitError) {
      toast.error("Le plafond par transaction dépasse le plafond mensuel")
      return
    }
    if (!isKardPaySupported({ network, currency: account.currency })) {
      // Filet de sécurité : le sélecteur ci-dessous désactive déjà cette
      // combinaison, ce cas ne devrait normalement pas être atteignable.
      toast.error("Produit non disponible chez KardPay", {
        description: "Seule une carte Visa en USD peut être émise pour l'instant (produit access-finance-virtual-usd).",
      })
      return
    }

    if (!idemKeyRef.current) idemKeyRef.current = createIdempotencyKey()
    setSubmitting(true)
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idemKeyRef.current },
        cache: "no-store",
        body: JSON.stringify({
          email: client.email,
          phone: client.phone || undefined,
          card_name: `${account.holder} — carte virtuelle`,
        }),
      })
      const data = (await res.json().catch(() => null)) as (IssueCardResponse & { error?: string; message?: string }) | null

      if (!res.ok) {
        toast.error("Émission impossible", { description: kardpayErrorMessage(data?.error, data?.message) })
        return
      }

      // Succès décidé (card active/pending créée) : on peut repartir d'une
      // nouvelle clé pour la prochaine émission.
      idemKeyRef.current = null

      if (data?.status === "awaiting_funds") {
        toast.info(`Carte ${networkLabels[network]} en file d'attente pour ${account.holder}`, {
          description: "L'escrow KardPay n'a pas encore les fonds disponibles ; la carte sera émise automatiquement dès que possible.",
        })
      } else if (data?.status === "pending") {
        toast.info(`Carte ${networkLabels[network]} en cours de traitement pour ${account.holder}`, {
          description: "L'émetteur n'a pas encore confirmé ; le statut se mettra à jour automatiquement.",
        })
      } else {
        toast.success(`Carte ${networkLabels[network]} émise pour ${account.holder}`, {
          description: "Les données de la carte ont été envoyées au client par SMS sécurisé.",
        })
      }
      router.push("/cartes-virtuelles")
    } catch {
      // Erreur réseau / 5xx : la doc (6.4) recommande de réessayer avec la
      // MÊME clé, donc on la garde dans idemKeyRef pour le prochain clic.
      toast.error("Service carte injoignable", { description: "Vérifiez la connexion et réessayez." })
    } finally {
      setSubmitting(false)
    }
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
              <span className="mt-1 block text-muted-foreground">
                Email titulaire (requis par KardPay) : <span className="text-foreground">{client.email}</span>
              </span>
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
              {(["visa", "mastercard"] as const).map((n) => {
                // KardPay ne signe qu'un seul produit : access-finance-virtual-usd
                // (Visa, USD — section 9). Le reste reste visible (autres
                // fournisseurs possibles un jour) mais désactivé ici plutôt que
                // de laisser l'utilisateur le choisir pour échouer à la soumission.
                const supported = isKardPaySupported({ network: n, currency: account.currency })
                return (
                  <Label
                    key={n}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 font-normal",
                      supported ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                      network === n && supported && "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem value={n} disabled={!supported} />
                    <NetworkLogo network={n} />
                    <span className="flex flex-col">
                      <span className="font-medium">{networkLabels[n]}</span>
                      {!supported && (
                        <span className="text-[11px] text-muted-foreground">Non disponible via KardPay</span>
                      )}
                    </span>
                  </Label>
                )
              })}
            </RadioGroup>
            {account.currency !== "USD" && (
              <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                Ce compte est en {account.currency} : KardPay n&apos;émet qu&apos;en USD (produit
                access-finance-virtual-usd). Choisissez un compte en USD pour émettre réellement la carte.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Les plafonds ci-dessous sont des limites internes Accès Finance : KardPay n&apos;a pas de notion de
              plafond par carte, elles ne lui sont pas envoyées.
            </p>
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
            <Button type="submit" className="h-10 w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              Émettre la carte
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
