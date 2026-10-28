"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterSelect } from "@/components/shared/data-table"
import { FormField } from "@/components/shared/form-field"

type Toggle = { id: string; label: string; description: string }

const securityToggles: Toggle[] = [
  { id: "3ds", label: "3-D Secure obligatoire", description: "Confirmation OTP pour tous les paiements en ligne." },
  { id: "intl", label: "Transactions internationales par défaut", description: "Autoriser les marchands hors RDC à l'émission." },
  { id: "autoBlock", label: "Blocage automatique", description: "Bloquer la carte après 3 échecs CVV consécutifs." },
  { id: "riskyMcc", label: "Refuser les catégories à risque", description: "Jeux d'argent, crypto-actifs, transferts d'argent." },
]

const notificationToggles: Toggle[] = [
  { id: "smsTx", label: "SMS à chaque transaction", description: "Le client reçoit un SMS pour chaque paiement." },
  { id: "emailMonthly", label: "Relevé mensuel par e-mail", description: "Envoyé le 1er de chaque mois." },
  { id: "limitAlert", label: "Alerte de plafond", description: "Avertir le client à 80 % du plafond mensuel." },
  { id: "staffAlert", label: "Alertes équipe risques", description: "Notifier les analystes en cas d'alerte critique." },
]

const fees = [
  { id: "issue", label: "Frais d'émission", value: "5.00" },
  { id: "monthly", label: "Frais de gestion mensuels", value: "1.50" },
  { id: "fx", label: "Commission de change (%)", value: "2.5" },
  { id: "renew", label: "Frais de renouvellement", value: "3.00" },
  { id: "replace", label: "Remplacement (carte compromise)", value: "0.00" },
]

function ToggleList({
  toggles,
  values,
  onChange,
}: {
  toggles: Toggle[]
  values: Record<string, boolean>
  onChange: (id: string, value: boolean) => void
}) {
  return (
    <div className="divide-y rounded-lg border">
      {toggles.map((t) => (
        <Label key={t.id} className="flex items-center justify-between gap-4 p-4 font-normal">
          <span>
            <span className="block font-medium">{t.label}</span>
            <span className="block text-xs text-muted-foreground">{t.description}</span>
          </span>
          <Switch checked={values[t.id]} onCheckedChange={(v) => onChange(t.id, v)} />
        </Label>
      ))}
    </div>
  )
}

export function CardSettingsView() {
  const [values, setValues] = useState<Record<string, boolean>>({
    "3ds": true,
    intl: true,
    autoBlock: true,
    riskyMcc: true,
    smsTx: true,
    emailMonthly: true,
    limitAlert: true,
    staffAlert: false,
  })
  const [validity, setValidity] = useState("3")
  const [network, setNetwork] = useState("visa")
  const set = (id: string, v: boolean) => setValues((prev) => ({ ...prev, [id]: v }))
  const save = () => toast.success("Paramètres enregistrés")

  return (
    <Tabs defaultValue="general" className="gap-4">
      <TabsList className="bg-foreground/5">
        <TabsTrigger value="general">Général</TabsTrigger>
        <TabsTrigger value="security">Sécurité</TabsTrigger>
        <TabsTrigger value="fees">Frais</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Paramètres d&apos;émission</CardTitle>
            <CardDescription>Valeurs proposées par défaut lors de l&apos;émission d&apos;une carte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Réseau par défaut">
                <FilterSelect
                  items={[{ value: "visa", label: "Visa Virtual" }, { value: "mastercard", label: "Mastercard Virtual" }]}
                  value={network}
                  onChange={setNetwork}
                  className="w-full text-sm"
                />
              </FormField>
              <FormField label="Durée de validité">
                <FilterSelect
                  items={[{ value: "1", label: "1 an" }, { value: "2", label: "2 ans" }, { value: "3", label: "3 ans" }]}
                  value={validity}
                  onChange={setValidity}
                  className="w-full text-sm"
                />
              </FormField>
              <FormField label="Préfixe des références" htmlFor="prefix">
                <Input id="prefix" defaultValue="VC-" />
              </FormField>
              <FormField label="BIN Visa" htmlFor="binVisa" hint="Fourni par le processeur">
                <Input id="binVisa" defaultValue="465859" />
              </FormField>
              <FormField label="BIN Mastercard" htmlFor="binMc" hint="Fourni par le processeur">
                <Input id="binMc" defaultValue="535522" />
              </FormField>
              <FormField label="Cartes max. par client" htmlFor="maxCards">
                <Input id="maxCards" type="number" defaultValue={3} min={1} />
              </FormField>
            </div>
            <Button onClick={save}>Enregistrer</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Sécurité</CardTitle>
            <CardDescription>Règles appliquées à toutes les cartes virtuelles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleList toggles={securityToggles} values={values} onChange={set} />
            <Button onClick={save}>Enregistrer</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="fees">
        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Grille tarifaire</CardTitle>
            <CardDescription>Montants en USD, prélevés sur le compte lié.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {fees.map((f) => (
                <FormField key={f.id} label={f.label} htmlFor={f.id}>
                  <Input id={f.id} type="number" step="0.01" min={0} defaultValue={f.value} />
                </FormField>
              ))}
            </div>
            <Button onClick={save}>Enregistrer</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleList toggles={notificationToggles} values={values} onChange={set} />
            <Button onClick={save}>Enregistrer</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
