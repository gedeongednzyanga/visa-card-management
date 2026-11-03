// Signature des requêtes vers l'API Partenaire KardPay (format KP1-HMAC).
// Voir la documentation KardPay, section 4 — "Authentication and request signing".
//
// Ce fichier est server-only : il ne doit JAMAIS être importé par un composant
// "use client" ni par du code qui s'exécute dans le navigateur. Le secret de la
// clé API KardPay ne doit exister que côté serveur (backend / route handler).
// Rien ici ne doit être loggé : ni le secret, ni la signature, ni le nonce.

import { createHash, createHmac, randomBytes } from "node:crypto"

export type KardPaySignedRequest = {
  method: string
  /** Chemin seul, ex. "/partner/v1/cards". Jamais l'hôte, jamais la query string. */
  path: string
  /**
   * Paires "clé=valeur" déjà URL-encodées, ex. ["limit=2", "cursor=abc"].
   * Omis ou vide si la requête n'a pas de query string.
   */
  queryPairs?: string[]
  /** Corps brut exact qui sera envoyé. Omis pour une requête GET sans corps. */
  body?: string
}

export type KardPayCredentials = {
  keyId: string
  secret: string
}

// SHA-256 du corps vide, donné par la doc (section 4.1) — utilisé tel quel pour
// toute requête GET, qui n'a pas de corps.
const EMPTY_BODY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

function bodyHash(body: string | undefined): string {
  if (!body) return EMPTY_BODY_SHA256
  return createHash("sha256").update(body, "utf8").digest("hex")
}

// Section 4.1 : les paires sont triées comme de simples chaînes, puis jointes par "&".
// La ligne reste présente (vide) quand il n'y a pas de query string.
function canonicalQueryLine(queryPairs: string[] = []): string {
  return [...queryPairs].sort().join("&")
}

/**
 * Construit la chaîne canonique à signer : exactement sept lignes jointes par LF,
 * sans retour à la ligne final (section 4.1).
 */
export function buildCanonicalString(req: KardPaySignedRequest, ts: string, nonce: string): string {
  return [
    "KP1",
    ts,
    nonce,
    req.method.toUpperCase(),
    req.path,
    canonicalQueryLine(req.queryPairs),
    bodyHash(req.body),
  ].join("\n")
}

/** HMAC-SHA256 de la chaîne canonique, en hexadécimal minuscule (section 4.2). */
export function signCanonicalString(canonical: string, secret: string): string {
  return createHmac("sha256", secret).update(canonical, "utf8").digest("hex")
}

/**
 * Construit l'en-tête Authorization complet pour une requête KardPay signée.
 *
 * `ts` et `nonce` sont injectables uniquement pour rejouer les vecteurs de test
 * de la section 4.3 ; en usage normal, ne jamais les fournir : ts = l'heure
 * courante, nonce = aléatoire, généré à chaque appel.
 */
export function buildAuthorizationHeader(
  req: KardPaySignedRequest,
  creds: KardPayCredentials,
  opts: { ts?: string; nonce?: string } = {}
): string {
  const ts = opts.ts ?? Math.floor(Date.now() / 1000).toString()
  // >= 16 caractères aléatoires, unique par requête (section 4) : jamais réutilisé,
  // même en cas de retry — un retry doit utiliser un nouveau nonce (le nonce n'est
  // pas ce qui protège les retries, l'Idempotency-Key s'en charge ailleurs).
  const nonce = opts.nonce ?? randomBytes(16).toString("hex")
  const canonical = buildCanonicalString(req, ts, nonce)
  const sig = signCanonicalString(canonical, creds.secret)
  return `KP1-HMAC keyId=${creds.keyId},ts=${ts},nonce=${nonce},sig=${sig}`
}
