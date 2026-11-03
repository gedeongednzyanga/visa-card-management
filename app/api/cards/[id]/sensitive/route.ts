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

import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { ApiError, apiFetch } from "@/lib/api"
import { KardPayError, kardpayFetch } from "@/lib/kardpay/client"
import { ACCESS_COOKIE } from "@/lib/session"

type SensitiveCardData = { pan: string; cvv: string; expiry_mmyy: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // Vérifie que la session dashboard est valide avant de révéler quoi que ce soit.
  try {
    await apiFetch("/auth/me", { token })
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 })
  }

  const { id } = await params

  try {
    const data = await kardpayFetch<SensitiveCardData>(`/partner/v1/cards/${id}/sensitive`)
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
