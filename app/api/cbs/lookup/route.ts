// Relaie GetClientdetails + GetClientAccounts vers le CBS BankSoft
// (fournisseur Processware). Route de TEST/DIAGNOSTIC uniquement — voir
// components/views/cbs-test-view.tsx — pas une intégration métier finale.
// Le vrai flux (émission de carte, financement) passera par le futur
// backend, pas par ce relais Next.js (plan technique, section "Modèle
// opérationnel", section 7).

import { NextResponse, type NextRequest } from "next/server"
import { BankSoftError, banksoftFetch } from "@/lib/banksoft/client"
import { requireDashboardSession } from "@/lib/require-session"

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
  const session = await requireDashboardSession()
  if (!session.ok) return session.response

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
    return NextResponse.json({ error: "banksoft_unavailable" }, { status: 502 })
  }
}
