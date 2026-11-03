// Relaie POST /partner/v1/cards (doc KardPay section 10.3) — émission d'une
// carte virtuelle.
//
// Le produit signé par Accès Finance est "access-finance-virtual-usd"
// (Visa, USD ; section 9, catalogue). Les champs acceptés sont limités à
// ceux de la section 10.3 — "unknown fields are rejected" par KardPay, donc
// ce fichier ne doit PAS ajouter monthlyLimit/perTransactionLimit ou tout
// autre champ "plafond" : KardPay n'a aucune notion de plafond par carte,
// ce sont des limites internes à appliquer et stocker côté Accès Finance
// (voir le plan d'adaptation, étape 4), pas à envoyer ici.
//
// Réponses possibles, toutes légitimes (pas seulement 201) :
//   201               carte créée, active ou pending selon le produit
//   202 pending       l'émetteur n'a pas encore confirmé
//   202 awaiting_funds  en file d'attente de fonds (si queue_if_insufficient)
// Le frontend doit distinguer ces trois cas, pas les traiter comme un échec.

import { NextResponse, type NextRequest } from "next/server"
import { KardPayError, kardpayFetch } from "@/lib/kardpay/client"
import { requireDashboardSession, requireIdempotencyKey } from "@/lib/require-session"

const PRODUCT_ID = "access-finance-virtual-usd"

type IssueCardBody = {
  email: string
  card_name?: string
  phone?: string
  external_ref?: string
  queue_if_insufficient?: boolean
}

export async function POST(req: NextRequest) {
  const session = await requireDashboardSession()
  if (!session.ok) return session.response

  const idem = requireIdempotencyKey(req)
  if (!idem.ok) return idem.response

  let body: IssueCardBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "validation_error", message: "Corps JSON invalide." }, { status: 422 })
  }

  if (!body.email) {
    return NextResponse.json(
      { error: "validation_error", message: "email est requis (section 10.3)." },
      { status: 422 }
    )
  }

  try {
    const { status, data } = await kardpayFetch(`/partner/v1/cards`, {
      method: "POST",
      idempotencyKey: idem.key,
      body: {
        product_id: PRODUCT_ID,
        email: body.email,
        ...(body.card_name ? { card_name: body.card_name } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.external_ref ? { external_ref: body.external_ref } : {}),
        ...(body.queue_if_insufficient !== undefined
          ? { queue_if_insufficient: body.queue_if_insufficient }
          : {}),
      },
    })
    return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    if (e instanceof KardPayError) {
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status || 502 })
    }
    return NextResponse.json({ error: "kardpay_unavailable" }, { status: 502 })
  }
}
