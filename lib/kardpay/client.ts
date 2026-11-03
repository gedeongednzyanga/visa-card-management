// Client HTTP minimal pour l'API Partenaire KardPay.
//
// Server-only. Ne jamais importer depuis un composant "use client" : ce fichier
// lit les identifiants KardPay depuis les variables d'environnement serveur.

import { buildAuthorizationHeader, type KardPayCredentials } from "./sign"

export class KardPayError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
  }
}

function credentialsFromEnv(): KardPayCredentials {
  const keyId = process.env.KARDPAY_KEY_ID
  const secret = process.env.KARDPAY_SECRET
  if (!keyId || !secret) {
    throw new Error(
      "KARDPAY_KEY_ID / KARDPAY_SECRET manquants. Configurer ces variables d'environnement côté serveur (jamais exposées au client)."
    )
  }
  return { keyId, secret }
}

function baseUrl(): string {
  const url = process.env.KARDPAY_BASE_URL
  if (!url) throw new Error("KARDPAY_BASE_URL manquant.")
  return url.replace(/\/+$/, "")
}

type KardPayRequestInit = {
  method?: "GET" | "POST"
  /** Query déjà au format "clé=valeur", chaque paire déjà URL-encodée. */
  queryPairs?: string[]
  body?: unknown
  /** Obligatoire pour toute route qui le requiert — voir doc section 6.1. */
  idempotencyKey?: string
}

/**
 * Appelle un endpoint du Partner API, signé en KP1-HMAC (section 4).
 * `path` commence par "/partner/v1/...".
 */
export async function kardpayFetch<T>(path: string, init: KardPayRequestInit = {}): Promise<T> {
  const method = init.method ?? "GET"
  const bodyStr = init.body !== undefined ? JSON.stringify(init.body) : undefined
  const creds = credentialsFromEnv()

  const authHeader = buildAuthorizationHeader(
    { method, path, queryPairs: init.queryPairs, body: bodyStr },
    creds
  )

  const qs = init.queryPairs?.length ? `?${init.queryPairs.join("&")}` : ""
  const url = `${baseUrl()}${path}${qs}`

  const headers: Record<string, string> = {
    Authorization: authHeader,
    "Content-Type": "application/json",
  }
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey

  let res: Response
  try {
    res = await fetch(url, { method, headers, body: bodyStr, cache: "no-store" })
  } catch {
    throw new KardPayError(0, "network_error", "KardPay est injoignable.")
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const code = data?.error?.code ?? "unknown_error"
    const message = data?.error?.message ?? "Erreur KardPay inattendue."
    throw new KardPayError(res.status, code, message)
  }

  return data as T
}
