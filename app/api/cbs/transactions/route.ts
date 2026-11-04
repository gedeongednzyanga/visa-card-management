// Relève l'historique d'un compte via GetAccountTransactions (CBS BankSoft).
// Route de TEST/DIAGNOSTIC, mêmes règles que app/api/cbs/lookup/route.ts :
// session dashboard exigée seulement en production, jamais à étendre à une
// route qui écrit.
//
// Constats du 04/11/2026 contre l'API UAT : l'ASMX exige TOUS les paramètres
// (page, limit, startDate, endDate, type, movement, status — "" = pas de
// filtre), sinon 500 générique ; les dates doivent être au format yyyy-MM-dd.

import { NextResponse, type NextRequest } from "next/server"
import { BankSoftError, banksoftFetch } from "@/lib/banksoft/client"
import { requireDashboardSession } from "@/lib/require-session"

const SESSION_REQUIRED = process.env.NODE_ENV === "production"
const DATE = /^(\d{4}-\d{2}-\d{2})?$/

type Transactions = {
  success: boolean
  data: {
    accountNumber: string
    transactions: {
      id: string
      reference: string
      type: string
      movement: string
      amount: number
      currency: string
      balanceBefore: number
      balanceAfter: number
      status: string
      description: string
      createdAt: string
    }[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }
}

export async function POST(req: NextRequest) {
  if (SESSION_REQUIRED) {
    const session = await requireDashboardSession()
    if (!session.ok) return session.response
  } else {
    console.warn("[cbs/transactions] Session dashboard non vérifiée (hors production) — route de test uniquement.")
  }

  let body: { accountNumber?: string; startDate?: string; endDate?: string; page?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "validation_error", message: "Corps JSON invalide." }, { status: 422 })
  }

  const accountNumber = (body.accountNumber ?? "").trim()
  const startDate = body.startDate ?? ""
  const endDate = body.endDate ?? ""
  const page = Number.isInteger(body.page) && (body.page as number) > 0 ? (body.page as number) : 1

  if (!/^\d{6,20}$/.test(accountNumber)) {
    return NextResponse.json({ error: "validation_error", message: "Numéro de compte invalide." }, { status: 422 })
  }
  if (!DATE.test(startDate) || !DATE.test(endDate)) {
    return NextResponse.json({ error: "validation_error", message: "Dates attendues au format AAAA-MM-JJ." }, { status: 422 })
  }

  try {
    const result = await banksoftFetch<Transactions>("GetAccountTransactions", {
      accountNumber,
      requestId: crypto.randomUUID(),
      page: String(page),
      limit: "10",
      startDate,
      endDate,
      type: "",
      movement: "",
      status: "",
    })
    if (!result.data?.transactions) {
      console.error("[cbs/transactions] forme de réponse inattendue — clés :", Object.keys(result ?? {}))
      return NextResponse.json({ error: "unexpected_response", message: "Réponse du CBS dans une forme inattendue." }, { status: 502 })
    }
    return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    if (e instanceof BankSoftError) {
      // Le CBS répond HTTP 200 même pour une erreur applicative : on ne
      // renvoie jamais 2xx avec un corps d'erreur.
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status >= 400 ? e.status : e.status === 0 ? 502 : 422 })
    }
    console.error("[cbs/transactions]", e)
    return NextResponse.json(
      { error: "banksoft_unavailable", message: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    )
  }
}
