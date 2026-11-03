"use client"

// Vue de TEST/DIAGNOSTIC pour l'intégration CBS BankSoft (Processware) —
// pas une page métier finale. Permet de vérifier, depuis le dashboard,
// qu'un clientId réel renvoie bien ses informations et ses comptes via
// le relais /api/cbs/lookup. Voir le plan technique, onglet "Modèle
// opérationnel", section 7.
//
// Cette page affiche des données client réelles (nom, téléphone, soldes)
// une fois interrogée : à ne pas laisser accessible aux agents une fois
// l'intégration réelle construite (elle n'est pas dans le menu latéral
// pour cette raison — accès par URL directe uniquement pendant les tests).

import { useState } from "react"
import { AlertTriangle, Landmark, Loader2, Search, User } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAmount } from "@/lib/format"

type LookupResult = {
  client: { clientId: string; firstName: string; lastName: string; email: string; phone: string; status: string }
  accounts: { accountNumber: string; accountType: string; currency: string; balance: number; status: string }[]
}

export function CbsTestView() {
  const [clientId, setClientId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/cbs/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientId.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Erreur inconnue.")
        toast.error("Échec de la requête CBS", { description: data.message ?? data.error })
        return
      }
      setResult(data)
      toast.success("Client trouvé")
    } catch {
      setError("Le serveur est injoignable.")
      toast.error("Le serveur est injoignable.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-xs ring-foreground/5 border-dashed">
        <CardContent className="flex items-start gap-3 pt-6 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p>
            Page de test interne : interroge le CBS BankSoft en direct (environnement déterminé par la clé
            configurée côté serveur). N&apos;utilisez que des <code>clientId</code> de test — les données
            affichées ci-dessous sont réelles.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-xs ring-foreground/5">
        <CardHeader>
          <CardTitle className="font-semibold">Recherche client CBS</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                // Ce composant Input (Base UI) ignore silencieusement onChange en
                // mode contrôlé : il faut onValueChange, sinon le champ se remplit
                // visuellement mais l'état React ne se met jamais à jour.
                onValueChange={setClientId}
                placeholder="ex. 200000004"
              />
            </div>
            <Button type="submit" disabled={loading || !clientId.trim()}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
              Rechercher
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="shadow-xs ring-destructive/20 border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {result && (
        <>
          <Card className="shadow-xs ring-foreground/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <User className="size-4" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <div className="text-muted-foreground">Nom</div>
                <div className="font-medium">
                  {result.client.firstName} {result.client.lastName}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Statut</div>
                <div className="font-medium">{result.client.status}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Téléphone</div>
                <div className="font-medium">{result.client.phone || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Email</div>
                <div className="font-medium">{result.client.email || "—"}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs ring-foreground/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <Landmark className="size-4" />
                Comptes ({result.accounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead>Solde</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.accounts.map((a) => (
                    <TableRow key={a.accountNumber}>
                      <TableCell className="font-mono text-xs">{a.accountNumber}</TableCell>
                      <TableCell>{a.accountType}</TableCell>
                      <TableCell>{a.currency}</TableCell>
                      <TableCell>{formatAmount(a.balance, a.currency as "USD" | "CDF")}</TableCell>
                      <TableCell>{a.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
