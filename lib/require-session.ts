// Vérification de session dashboard partagée par les routes qui relaient
// vers KardPay. Centralise la logique utilisée par app/api/cards/**/route.ts
// pour éviter que chaque route réimplémente (et risque de désynchroniser)
// la vérification "l'utilisateur est bien connecté".
//
// Rappel : ceci confirme seulement qu'une session dashboard valide existe,
// PAS que cet utilisateur a le droit d'agir sur la carte précise visée —
// cette autorisation par carte reste à construire côté backend réel
// (voir le TODO dans app/api/cards/[id]/sensitive/route.ts).

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ApiError, apiFetch } from "@/lib/api"
import { ACCESS_COOKIE } from "@/lib/session"

export type SessionCheck = { ok: true; token: string } | { ok: false; response: NextResponse }

export async function requireDashboardSession(): Promise<SessionCheck> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value

  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) }
  }

  try {
    await apiFetch("/auth/me", { token })
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) }
    }
    return { ok: false, response: NextResponse.json({ error: "auth_unavailable" }, { status: 503 }) }
  }

  return { ok: true, token }
}

/** Lit l'Idempotency-Key envoyée par le frontend ; 400 si absente ou invalide (doc section 6.3). */
export function requireIdempotencyKey(req: Request): { ok: true; key: string } | { ok: false; response: NextResponse } {
  const key = req.headers.get("Idempotency-Key")
  if (!key || key.length < 1 || key.length > 255) {
    return {
      ok: false,
      response: NextResponse.json({ error: "idempotency_key_required" }, { status: 400 }),
    }
  }
  return { ok: true, key }
}
