// Vérification des webhooks KardPay (doc section 12.4) : HMAC-SHA256,
// clé = secret de l'endpoint webhook, sur `"${timestamp}."` concaténé aux
// octets BRUTS du corps (avant tout JSON.parse), comparaison en temps
// constant, et un timestamp vieux de plus de 5 minutes est rejeté.
//
// Server-only : le secret webhook ne doit jamais atteindre le navigateur.
//
// IMPORTANT (voir le plan technique, "Analyse & adaptation", étape 8) :
// ce fichier porte UNIQUEMENT la vérification de signature, réutilisable
// telle quelle par le futur backend. Il n'y a volontairement PAS de route
// app/api/webhooks/kardpay/route.ts dans ce dépôt Next.js — recevoir de
// vrais webhooks suppose un endroit pour persister l'état des cartes
// (une base de données) et dédupliquer les ids d'événements (section
// 12.2 : "a redelivery keeps the same id, store processed ids and ignore
// repeats"), ce que ce frontend n'a pas. Faire semblant de les recevoir
// ici n'apporterait rien de réel — c'est exactement ce que l'étape 8 du
// plan d'adaptation dit de faire "côté backend, pas dans ce dépôt".

import { createHmac, timingSafeEqual } from "node:crypto"

export type WebhookVerifyResult =
  | { ok: true }
  | { ok: false; reason: "malformed_header" | "timestamp_out_of_tolerance" | "signature_mismatch" }

/**
 * `header` est la valeur brute de l'en-tête `KP1-Webhook` : `t=<unix>,v1=<hex>`.
 * `rawBody` doit être les octets EXACTS reçus sur le fil, jamais une
 * version re-sérialisée après un JSON.parse (qui ne reproduirait pas
 * forcément les mêmes octets).
 */
export function verifyKardPayWebhook(
  secret: string,
  header: string | null,
  rawBody: Buffer | string,
  toleranceSeconds = 300
): WebhookVerifyResult {
  if (!header) return { ok: false, reason: "malformed_header" }

  const parts: Record<string, string> = {}
  for (const item of header.split(",")) {
    const idx = item.indexOf("=")
    if (idx === -1) return { ok: false, reason: "malformed_header" }
    parts[item.slice(0, idx)] = item.slice(idx + 1)
  }
  const { t: ts, v1: sig } = parts
  if (!ts || !sig) return { ok: false, reason: "malformed_header" }

  const timestamp = Number(ts)
  if (!Number.isFinite(timestamp)) return { ok: false, reason: "malformed_header" }
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) {
    return { ok: false, reason: "timestamp_out_of_tolerance" }
  }

  const bodyBuf = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody
  const signedPayload = Buffer.concat([Buffer.from(`${ts}.`, "utf8"), bodyBuf])
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex")

  const expectedBuf = Buffer.from(expected, "hex")
  const sigBuf = Buffer.from(sig, "hex")
  if (expectedBuf.length !== sigBuf.length || !timingSafeEqual(expectedBuf, sigBuf)) {
    return { ok: false, reason: "signature_mismatch" }
  }
  return { ok: true }
}
