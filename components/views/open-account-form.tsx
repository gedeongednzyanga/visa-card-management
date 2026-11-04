"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, FileCheck2, Landmark } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FilterSelect } from "@/components/shared/data-table"
import { FormField } from "@/components/shared/form-field"
import { accountTypeLabels, clients, type AccountType } from "@/lib/data/clients"
import { agencies } from "@/lib/data/seed"
import { formatAmount } from "@/lib/format"
import { cn } from "@/lib/utils"

const eligibleClients = clients.filter((c) => c.kyc === "verifie" && c.active)

const minimumDeposit: Record<AccountType, number> = {
  courant: 10,
  epargne: 50,
  entreprise: 500,
}

export function OpenAccountForm() {
  const router = useRouter()
  const [clientId, setClientId] = useState(eligibleClients[0].id)
  const [type, setType] = useState<AccountType>("courant")
  const [currency, setCurrency] = useState<"USD" | "CDF">("USD")
  const [agency, setAgency] = useState<string>(agencies[0])
  const [deposit, setDeposit] = useState("")
  const [withCard, setWithCard] = useState(true)

  const client = eligibleClients.find((c) => c.id === clientId)!
  const minimum = minimumDeposit[type] * (currency === "CDF" ? 2800 : 1)
  const depositValue = Number(deposit) || 0
  const depositOk = depositValue >= minimum

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!depositOk) {
      toast.error(`Le dépôt initial minimum est de ${formatAmount(minimum, currency)}`)
      return
    }
    toast.success(`Compte ouvert pour ${client.name}`, {
      description: withCard ? "Une demande de carte virtuelle a été créée." : undefined,
    })
    router.push("/comptes")
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">1. Client</CardTitle>
            <CardDescription>Seuls les clients actifs avec un KYC vérifié sont proposés.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField label="Client">
              <FilterSelect
                items={eligibleClients.map((c) => ({ value: c.id, label: `${c.name} (${c.id})` }))}
                value={clientId}
                onChange={setClientId}
                className="w-full text-sm"
              />
            </FormField>
            <FormField label="Agence de rattachement">
              <FilterSelect
                items={agencies.map((a) => ({ value: a, label: a }))}
                value={agency}
                onChange={setAgency}
                className="w-full text-sm"
              />
            </FormField>
          </CardContent>
        </Card>

        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">2. Type de compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as AccountType)}
              className="grid gap-3 sm:grid-cols-3"
            >
              {(Object.keys(accountTypeLabels) as AccountType[]).map((t) => (
                <Label
                  key={t}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal",
                    type === t && "border-primary bg-primary/5"
                  )}
                >
                  <RadioGroupItem value={t} className="mt-0.5" />
                  <span>
                    <span className="block font-medium">{accountTypeLabels[t]}</span>
                    <span className="block text-xs text-muted-foreground">
                      Dépôt min. {formatAmount(minimumDeposit[t], "USD")}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Devise">
                <FilterSelect
                  items={[{ value: "USD", label: "USD — Dollar américain" }, { value: "CDF", label: "CDF — Franc congolais" }]}
                  value={currency}
                  onChange={(v) => setCurrency(v as "USD" | "CDF")}
                  className="w-full text-sm"
                />
              </FormField>
              <FormField
                label="Dépôt initial"
                htmlFor="deposit"
                hint={`Minimum : ${formatAmount(minimum, currency)}`}
              >
                <Input
                  id="deposit"
                  type="number"
                  min={0}
                  step="0.01"
                  value={deposit}
                  onValueChange={setDeposit}
                  placeholder="0.00"
                  aria-invalid={deposit !== "" && !depositOk}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">3. Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label className="flex items-center justify-between gap-4 rounded-lg border p-3 font-normal">
              <span>
                <span className="block font-medium">Demander une carte virtuelle</span>
                <span className="block text-xs text-muted-foreground">
                  Une demande Visa Virtual sera créée et soumise à validation.
                </span>
              </span>
              <Switch checked={withCard} onCheckedChange={setWithCard} />
            </Label>
            <FormField label="Remarques" htmlFor="notes">
              <Textarea id="notes" placeholder="Informations complémentaires pour le superviseur..." />
            </FormField>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit shadow-xs ring-foreground/5 xl:sticky xl:top-[76px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-semibold">
            <Landmark className="size-4.5 text-primary" />
            Récapitulatif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-2 text-[13px]">
            {[
              ["Client", client.name],
              ["ID client", client.id],
              ["Type", accountTypeLabels[type]],
              ["Devise", currency],
              ["Agence", agency],
              ["Dépôt initial", formatAmount(depositValue, currency)],
              ["Carte virtuelle", withCard ? "Oui" : "Non"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-xs">
            <li className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="size-3.5" /> KYC vérifié
            </li>
            <li className={cn("flex items-center gap-2", depositOk ? "text-emerald-700" : "text-muted-foreground")}>
              <FileCheck2 className="size-3.5" /> Dépôt minimum atteint
            </li>
          </ul>
          <Button type="submit" className="h-10 w-full">
            Ouvrir le compte
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
