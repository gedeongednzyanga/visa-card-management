// Vérifie qu'un appel réel à l'API Online Banking du CBS BankSoft
// (fournisseur Processware) fonctionne, et surtout que l'hypothèse de
// chiffrement posée dans lib/banksoft/crypto.ts est la bonne.
//
// Usage, une fois le Bearer Token en main (encore manquant au moment où
// ce script est écrit — voir BANKSOFT_BEARER_TOKEN dans .env.local) :
//
//   npm run banksoft:smoke-test
//
// Ce script ne devine rien côté serveur : il appelle GetClientdetails
// avec un clientId de test, affiche la réponse brute (pour diagnostic),
// puis tente de la déchiffrer avec l'hypothèse AES-256-CBC/UTF-8/PKCS7/
// Base64 documentée dans lib/banksoft/crypto.ts. Si le déchiffrement
// échoue, le message d'erreur du module crypto liste les points à
// revoir dans l'ordre le plus probable.
//
// Ne lit JAMAIS un secret depuis un argument de ligne de commande : tout
// vient de l'environnement (.env.local, jamais commité).

import { decryptBankSoftPayload } from "../lib/banksoft/crypto.ts"

async function main() {
  const required = ["BANKSOFT_BASE_URL", "BANKSOFT_API_KEY", "BANKSOFT_BEARER_TOKEN", "BANKSOFT_AES_KEY", "BANKSOFT_AES_IV"]
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`Variables manquantes : ${missing.join(", ")}`)
    console.error("Renseignez-les dans .env.local (voir .env.example) puis relancez.")
    process.exit(1)
  }

  const baseUrl = process.env.BANKSOFT_BASE_URL!.replace(/\/+$/, "")
  const requestId = `SMOKE-${Date.now()}`
  const body = JSON.stringify({ clientId: "CLI000001", requestId })

  console.log(`→ POST ${baseUrl}/GetClientdetails`)
  console.log(`  body (non chiffré, GetClientdetails n'en a pas besoin d'après la doc) : ${body}`)

  const res = await fetch(`${baseUrl}/GetClientdetails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BANKSOFT_BEARER_TOKEN}`,
      "x-api-key": process.env.BANKSOFT_API_KEY!,
      "Content-Type": "application/json",
    },
    body,
  })

  const raw = await res.text()
  console.log(`\n✓ HTTP ${res.status}`)
  console.log(`  réponse brute (${raw.length} caractères) : ${raw.slice(0, 200)}${raw.length > 200 ? "…" : ""}`)

  if (res.status !== 200) {
    console.error("\n✗ Statut non-200 — avant de toucher au chiffrement, vérifiez :")
    console.error("  401 → Bearer Token ou x-api-key invalide.")
    console.error("  403 → IP non autorisée (voir le point WAN IP / allowlist, plan technique section 7).")
    console.error("  404 → mauvaise URL/méthode ASMX.")
    process.exit(1)
  }

  console.log("\n→ Tentative de déchiffrement (hypothèse AES-256-CBC/UTF-8/PKCS7/Base64)…")
  try {
    const plaintext = decryptBankSoftPayload(raw.trim().replace(/^"|"$/g, ""), {
      key: process.env.BANKSOFT_AES_KEY!,
      iv: process.env.BANKSOFT_AES_IV!,
    })
    console.log("✓ Déchiffrement réussi, contenu :")
    console.log(plaintext)
    try {
      JSON.parse(plaintext)
      console.log("✓ Le résultat est un JSON valide — l'hypothèse de chiffrement semble correcte.")
    } catch {
      console.warn("⚠ Déchiffré, mais le résultat n'est pas du JSON valide — l'hypothèse est probablement fausse malgré l'absence d'erreur.")
    }
  } catch (err) {
    console.error("✗ Déchiffrement échoué :", err instanceof Error ? err.message : err)
    console.error("  Voir les commentaires de decryptBankSoftPayload (lib/banksoft/crypto.ts) pour les pistes à essayer.")
    console.error("  Si la réponse brute ci-dessus ressemble déjà à du JSON lisible, la réponse n'est peut-être pas chiffrée du tout pour cette méthode.")
    process.exit(1)
  }
}

main()
