// Chiffrement des échanges avec l'API Online Banking du CBS BankSoft
// (fournisseur Processware). Voir le plan technique, onglet "Modèle
// opérationnel", section 7.
//
// ✅ CONFIRMÉ le 03/11/2026 contre l'API UAT réelle : AES-256-CBC, clé et IV
// lus comme octets UTF-8 bruts, padding PKCS7, Base64, IV fixe. Le texte
// ci-dessous documente le raisonnement d'origine (l'hypothèse s'est avérée
// juste). Autres constats : le payload déchiffré est encodé en JSON deux fois
// (voir lib/banksoft/client.ts) et l'API renvoie HTTP 200 même en cas d'erreur
// applicative.
//
// Raisonnement d'origine
// ----------------------------------------------------------------------
// Le document fourni par Processware ("Banking API – Client Integration
// Document", section 4 "Encryption") indique que les réponses sont
// chiffrées (et, pour Transfer, que la requête l'est aussi), mais ne
// précise ni l'algorithme, ni le mode, ni la gestion de l'IV, ni
// l'encodage — ces détails sont explicitement signalés comme non
// fournis dans la documentation reçue.
//
// Ce module part de l'hypothèse la plus probable pour une implémentation
// .NET "maison" de ce type, déduite des valeurs fournies :
//   - Clé  : 32 caractères ASCII  → interprétés comme 32 octets UTF-8 → AES-256
//   - IV   : 16 caractères ASCII → interprétés comme 16 octets UTF-8 → taille de bloc AES
//   - Mode : CBC (le plus commun dans ce genre d'implémentation ASMX)
//   - Padding : PKCS7 (le défaut de System.Security.Cryptography.Aes en .NET)
//   - Encodage du résultat : Base64
//   - IV fixe, réutilisé à chaque appel (un seul IV a été fourni, pas de
//     mécanisme pour en transmettre un différent par requête) — notez que
//     c'est une pratique cryptographique faible (un IV fixe en CBC peut
//     fuiter de l'information sur des payloads répétés), mais ce n'est
//     pas à nous de la changer : on documente le fait, pas une recommandation.
//
// Rien de tout cela n'a été confronté à un vrai appel de l'API (UAT ou
// prod) : la sandbox de cette session n'a pas d'accès réseau vers les
// domaines d'Accès Finance. Dès qu'un appel réel (succès OU échec de
// déchiffrement) est possible, ajuster ce fichier en conséquence —
// voir `decryptBankSoftPayload` plus bas pour le point exact à modifier
// si le mode ou l'encodage s'avèrent différents.

import { createCipheriv, createDecipheriv } from "node:crypto"

export interface BankSoftCryptoConfig {
  /** 32 caractères ASCII → AES-256 (hypothèse : UTF-8, pas hexadécimal). */
  key: string
  /** 16 caractères ASCII → taille de bloc AES (hypothèse : UTF-8, pas hexadécimal). */
  iv: string
}

function toKeyBytes(config: BankSoftCryptoConfig) {
  const key = Buffer.from(config.key, "utf8")
  const iv = Buffer.from(config.iv, "utf8")
  if (key.length !== 32) {
    throw new Error(
      `BANKSOFT_AES_KEY : ${key.length} octets en UTF-8, 32 attendus pour AES-256. ` +
        "Si Processware confirme un encodage hexadécimal plutôt qu'UTF-8, adapter ici."
    )
  }
  if (iv.length !== 16) {
    throw new Error(
      `BANKSOFT_AES_IV : ${iv.length} octets en UTF-8, 16 attendus (taille de bloc AES). ` +
        "Si Processware confirme un encodage hexadécimal plutôt qu'UTF-8, adapter ici."
    )
  }
  return { key, iv }
}

/**
 * Chiffre un payload JSON (texte en clair) avant envoi — nécessaire
 * uniquement pour l'opération Transfer, d'après la doc fournie.
 */
export function encryptBankSoftPayload(plaintext: string, config: BankSoftCryptoConfig): string {
  const { key, iv } = toKeyBytes(config)
  const cipher = createCipheriv("aes-256-cbc", key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  return encrypted.toString("base64")
}

/**
 * Déchiffre une réponse de l'API — nécessaire pour toutes les opérations
 * d'après la doc fournie (section 4 : "encrypts API responses").
 *
 * Si ceci échoue contre un vrai appel UAT (erreur de padding / de
 * longueur), les points à revoir dans l'ordre le plus probable :
 *   1. L'encodage du payload reçu n'est peut-être pas Base64 (essayer hex).
 *   2. Le mode n'est peut-être pas CBC (essayer GCM — nécessite alors un
 *      tag d'authentification séparé, absent de la doc fournie).
 *   3. La clé/l'IV sont peut-être attendus en hexadécimal plutôt qu'en
 *      UTF-8 (32 caractères hex → 16 octets → AES-128, pas AES-256).
 */
export function decryptBankSoftPayload(ciphertextBase64: string, config: BankSoftCryptoConfig): string {
  const { key, iv } = toKeyBytes(config)
  const decipher = createDecipheriv("aes-256-cbc", key, iv)
  const decrypted = Buffer.concat([decipher.update(Buffer.from(ciphertextBase64, "base64")), decipher.final()])
  return decrypted.toString("utf8")
}

/**
 * La réponse brute de l'API est une chaîne JSON (entre guillemets) contenant
 * le Base64. On la décode comme une vraie chaîne JSON plutôt que de retirer
 * seulement les guillemets : sinon les séquences d'échappement éventuelles
 * (\\/, \\u002b, \\n...) restent dans le Base64 et cassent le déchiffrement
 * ("wrong final block length"), surtout sur les longues réponses.
 */
export function normalizeBankSoftCiphertext(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed === "string") return parsed.trim()
    } catch {
      // pas une chaîne JSON valide : repli ci-dessous
    }
  }
  return trimmed.replace(/^"|"$/g, "")
}
