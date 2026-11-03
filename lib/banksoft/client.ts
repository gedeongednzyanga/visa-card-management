// Client HTTP minimal pour l'API Online Banking du CBS BankSoft
// (fournisseur Processware). Voir le plan technique, onglet "Modèle
// opérationnel", section 7.
//
// Server-only. Ne jamais importer depuis un composant "use client" : ce
// fichier lit Bearer Token, x-api-key, clé/IV AES depuis les variables
// d'environnement serveur.
//
// Comportement confirmé contre l'API réelle en UAT le 03/11/2026 :
// toutes les réponses sont chiffrées (même en cas d'erreur applicative),
// et l'API renvoie HTTP 200 même pour une erreur applicative — l'erreur
// n'apparaît qu'une fois le payload déchiffré. C'est pourquoi ce client
// inspecte `success`/`error` dans le JSON déchiffré, pas seulement le
// code HTTP.

import { decryptBankSoftPayload, encryptBankSoftPayload } from "./crypto"

export class BankSoftError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
  }
}

function baseUrl(): string {
  const url = process.env.BANKSOFT_BASE_URL
  if (!url) throw new Error("BANKSOFT_BASE_URL manquant.")
  return url.replace(/\/+$/, "")
}

function cryptoConfig() {
  const key = process.env.BANKSOFT_AES_KEY
  const iv = process.env.BANKSOFT_AES_IV
  if (!key || !iv) {
    throw new Error("BANKSOFT_AES_KEY / BANKSOFT_AES_IV manquants. Configurer ces variables côté serveur uniquement.")
  }
  return { key, iv }
}

function headers(): Record<string, string> {
  const bearer = process.env.BANKSOFT_BEARER_TOKEN
  const apiKey = process.env.BANKSOFT_API_KEY
  if (!bearer || !apiKey) {
    throw new Error("BANKSOFT_BEARER_TOKEN / BANKSOFT_API_KEY manquants. Configurer ces variables côté serveur uniquement.")
  }
  return {
    Authorization: `Bearer ${bearer}`,
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  }
}

/**
 * Appelle une méthode du service ASMX. `body` est envoyé en clair pour les
 * méthodes de lecture (GetClientdetails, GetClientAccounts, ...) et chiffré
 * uniquement pour Transfer — passer `encryptRequest: true` dans ce cas
 * (doc section 4 : seule Transfer déchiffre son corps de requête).
 *
 * La réponse est toujours déchiffrée, puis vérifiée pour une erreur
 * applicative malgré un HTTP 200 (comportement confirmé en UAT).
 */
export async function banksoftFetch<T>(
  method: string,
  body: object,
  options: { encryptRequest?: boolean } = {}
): Promise<T> {
  const url = `${baseUrl()}/${method}`
  const bodyJson = JSON.stringify(body)
  const sentBody = options.encryptRequest ? encryptBankSoftPayload(bodyJson, cryptoConfig()) : bodyJson

  let res: Response
  try {
    res = await fetch(url, { method: "POST", headers: headers(), body: sentBody, cache: "no-store" })
  } catch {
    throw new BankSoftError(0, "network_error", "Le CBS BankSoft est injoignable.")
  }

  const raw = await res.text()

  if (!res.ok) {
    throw new BankSoftError(res.status, "http_error", `Erreur HTTP ${res.status} du CBS.`)
  }

  let plaintext: string
  try {
    plaintext = decryptBankSoftPayload(raw.trim().replace(/^"|"$/g, ""), cryptoConfig())
  } catch (err) {
    throw new BankSoftError(res.status, "decrypt_error", err instanceof Error ? err.message : "Déchiffrement échoué.")
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(plaintext)
  } catch {
    throw new BankSoftError(res.status, "invalid_json", "Réponse déchiffrée non-JSON.")
  }

  if (data.success === false || data.error) {
    const message = typeof data.message === "string" ? data.message : String(data.error ?? "Erreur CBS inattendue.")
    const code = typeof data.code === "string" || typeof data.code === "number" ? String(data.code) : "cbs_error"
    throw new BankSoftError(res.status, code, message)
  }

  return data as T
}
