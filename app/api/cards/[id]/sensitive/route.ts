// Relaie GET /partner/v1/cards/{id}/sensitive (PAN, CVV, expiry) depuis KardPay.
//
// Le frontend n'a jamais accès à la clé KardPay ni aux scopes : cette route
// s'exécute côté serveur, signe la requête, et ne renvoie la donnée qu'à une
// session dashboard authentifiée. Voir la doc KardPay section 10.9 :
//  - Cache-Control: no-store (jamais mis en cache, nulle part)
//  - jamais loguée (PAN, CVV)
//  - à récupérer à la demande, jamais en masse
//
// TODO (à faire avant toute connexion à un environnement KardPay réel) :
//  - vérifier que l'utilisateur authentifié a le droit de voir CETTE carte
//    précise (propriétaire du compte lié, ou rôle autorisé) — pas seulement
//    qu'il est connecté. Nécessite que le backend "acces-register" expose le
//    lien carte -> compte -> client.
//  - envoyer cet appel à un service backend dédié plutôt qu'à cette route
//    Next.js, une fois le backend du plan technique en place (séparation des
//    responsabilités : ce fichier n'est qu'un squelette de démonstration).

import { NextResponse, type NextRequest } from "next/server"
import { KardPayError, kardpayFetch } from "@/lib/kardpay/client"
import { requireDashboardSession } from "@/lib/require-session"

type SensitiveCardData = { pan: string; cvv: string; expiry_mmyy: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboardSession()
  if (!session.ok) return session.response

  const { id } = await params

  try {
    const { data } = await kardpayFetch<SensitiveCardData>(`/partner/v1/cards/${id}/sensitive`)
    return NextResponse.json(data, {
      // Jamais mis en cache — ni par le navigateur, ni par un proxy intermédiaire.
      headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
    })
  } catch (e) {
    if (e instanceof KardPayError) {
      return NextResponse.json({ error: e.code }, { status: e.status || 502 })
    }
    return NextResponse.json({ error: "kardpay_unavailable" }, { status: 502 })
  }
}
