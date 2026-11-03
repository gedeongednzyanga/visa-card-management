import type { Metadata } from "next"
import { CbsTestView } from "@/components/views/cbs-test-view"

// Délibérément HORS du groupe de routes (dashboard) : ce groupe redirige
// vers /connexion dès que acces-register (authentification du personnel)
// est injoignable, ce qui n'a aucun rapport avec ce qu'on teste ici. Cette
// page n'a donc ni la session dashboard, ni le menu latéral — un lien
// direct, pour la phase de test uniquement.

export const metadata: Metadata = {
  title: "Test CBS BankSoft · Accès Finance",
}

export default function CbsTestPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Test CBS BankSoft</h1>
      <CbsTestView />
    </main>
  )
}
