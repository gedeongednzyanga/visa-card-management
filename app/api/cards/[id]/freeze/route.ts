// Relaie POST /partner/v1/cards/{id}/freeze (doc KardPay section 10.7).
//
// Pas de body côté KardPay pour ce endpoint, mais Idempotency-Key est
// obligatoire (section 6.1) : le frontend doit la générer une fois par
// clic (voir lib/idempotency.ts) et la renvoyer identique sur toute
// relance. On la relaie telle quelle à KardPay, sans la régénérer ici —
// sinon une relance du frontend vers CETTE route recréerait une action
// différente à leurs yeux.
//
// Succès : 200 avec la carte mise à jour. Peut aussi renvoyer 202 pending
// si l'émetteur n'a pas confirmé tout de suite (section 10.7) : on relaie
// le status tel quel, le frontend doit l'afficher comme "en cours", pas
// comme un échec.

import { NextResponse, type NextRequest } from "next/server"
import { KardPayError, kardpayFetch } from "@/lib/kardpay/client"
import { requireDashboardSession, requireIdempotencyKey } from "@/lib/require-session"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboardSession()
  if (!session.ok) return session.response

  const idem = requireIdempotencyKey(req)
  if (!idem.ok) return idem.response

  const { id } = await params

  try {
    const { status, data } = await kardpayFetch(`/partner/v1/cards/${id}/freeze`, {
      method: "POST",
      idempotencyKey: idem.key,
    })
    return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    if (e instanceof KardPayError) {
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status || 502 })
    }
    return NextResponse.json({ error: "kardpay_unavailable" }, { status: 502 })
  }
}
