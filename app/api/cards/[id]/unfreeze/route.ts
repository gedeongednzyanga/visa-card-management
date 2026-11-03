// Relaie POST /partner/v1/cards/{id}/unfreeze (doc KardPay section 10.7).
// Symétrique de app/api/cards/[id]/freeze/route.ts — voir ses commentaires.

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
    const { status, data } = await kardpayFetch(`/partner/v1/cards/${id}/unfreeze`, {
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
