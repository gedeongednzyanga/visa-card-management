// Relaie GetClientdetails + GetClientAccounts vers le CBS BankSoft
// (fournisseur Processware). Route de TEST/DIAGNOSTIC uniquement — voir
// components/views/cbs-test-view.tsx — pas une intégration métier finale.
// Le vrai flux (émission de carte, financement) passera par le futur
// backend, pas par ce relais Next.js (plan technique, section "Modèle
// opérationnel", section 7).
//
// La session dashboard n'est exigée qu'en production. En développement
// local, le service acces-register (authentification) n'est pas toujours
// disponible pour qui teste uniquement l'intégration CBS — ça n'a aucun
// rapport avec ce qu'on vérifie ici. Ne jamais étendre cette exception à
// une route qui touche de vraies opérations (émission, transfert).

import { NextResponse, type NextRequest } from "next/server"
import { BankSoftError, banksoftFetch } from "@/lib/banksoft/client"
import { requireDashboardSession } from "@/lib/require-session"

const SESSION_REQUIRED = process.env.NODE_ENV === "production"

type ClientDetails = {
  success: boolean
  data: {
    clientId: string
    firstName: string
    lastName: string
    nickName?: string
    email: string
    phone: string
    status: string
  }
}

type ClientAccounts = {
  success: boolean
  data: {
    clientId: string
    accounts: { accountNumber: string; accountType: string; currency: string; balance: number; status: string }[]
  }
}

export async function POST(req: NextRequest) {
  if (SESSION_REQUIRED) {
    const session = await requireDashboardSession()
    if (!session.ok) return session.response
  } else {
    console.warn("[cbs/lookup] Session dashboard non vérifiée (hors production) — route de test uniquement.")
  }

  let body: { clientId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "validation_error", message: "Corps JSON invalide." }, { status: 422 })
  }

  if (!body.clientId) {
    return NextResponse.json({ error: "validation_error", message: "clientId est requis." }, { status: 422 })
  }

  try {
    const details = await banksoftFetch<ClientDetails>("GetClientdetails", {
      clientId: body.clientId,
      requestId: crypto.randomUUID(),
    })

    const accounts = await banksoftFetch<ClientAccounts>("GetClientAccounts", {
      clientId: body.clientId,
      requestId: crypto.randomUUID(),
    })

    return NextResponse.json(
      {
        client: details.data,
        accounts: accounts.data.accounts.map((a) => ({ ...a, accountNumber: a.accountNumber.trim() })),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (e) {
    if (e instanceof BankSoftError) {
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status || 502 })
    }
    // Une erreur qui n'est PAS un BankSoftError vient d'avant l'appel réseau
    // (ex. variable d'environnement manquante — voir cryptoConfig()/headers()
    // dans lib/banksoft/client.ts) : message inclus, utile en diagnostic,
    // sans secret dedans (ces erreurs ne citent que des NOMS de variables).
    console.error("[cbs/lookup]", e)
    return NextResponse.json(
      { error: "banksoft_unavailable", message: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    )
  }
}
