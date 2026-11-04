// Vérifie qu'un appel réel à l'API Online Banking du CBS BankSoft
// (fournisseur Processware) fonctionne, et surtout que l'hypothèse de
// chiffrement posée dans lib/banksoft/crypto.ts est la bonne.
//
// Usage, une fois le Bearer Token en main (encore manquant au moment où
// ce script est écrit — voir BANKSOFT_BEARER_TOKEN dans .env.local) :
//
//   npm run banksoft:smoke-test
//
// Ce script ne devine rien côté serveur : il appelle GetClientdetails puis
// GetClientAccounts avec un clientId réel, affiche chaque réponse brute
// (pour diagnostic), puis tente de la déchiffrer avec l'hypothèse
// AES-256-CBC/UTF-8/PKCS7/Base64 documentée dans lib/banksoft/crypto.ts.
// Si le déchiffrement échoue, le message d'erreur du module crypto liste
// les points à revoir dans l'ordre le plus probable.
//
// Usage :
//   npm run banksoft:smoke-test -- 200000007
// (le clientId n'est pas un secret — c'est un identifiant de compte test,
// pas une clé ni un token — donc il peut être passé en argument ; les
// vrais secrets, eux, viennent toujours de l'environnement.)

import { decryptBankSoftPayload, encryptBankSoftPayload, normalizeBankSoftCiphertext } from "../lib/banksoft/crypto.ts"

async function call(method: string, body: object, quiet = false, encrypt = false) {
  const baseUrl = process.env.BANKSOFT_BASE_URL!.replace(/\/+$/, "")
  const bodyJson = JSON.stringify(body)
  const sentBody = encrypt
    ? encryptBankSoftPayload(bodyJson, { key: process.env.BANKSOFT_AES_KEY!, iv: process.env.BANKSOFT_AES_IV! })
    : bodyJson
  console.log(`\n→ POST ${baseUrl}/${method}`)
  console.log(`  body (non chiffré, cette méthode n'en a pas besoin d'après la doc) : ${bodyJson}`)

  const res = await fetch(`${baseUrl}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BANKSOFT_BEARER_TOKEN}`,
      "x-api-key": process.env.BANKSOFT_API_KEY!,
      "Content-Type": "application/json",
    },
    body: sentBody,
  })

  const raw = await res.text()
  console.log(`✓ HTTP ${res.status}`)
  console.log(`  réponse brute (${raw.length} caractères) : ${raw.slice(0, 200)}${raw.length > 200 ? "…" : ""}`)

  if (res.status !== 200) {
    console.error("✗ Statut non-200 — avant de toucher au chiffrement, vérifiez :")
    console.error("  500 (réponse ASMX non chiffrée) → plantage côté serveur sur cette requête, pas un souci d'auth.")
    console.error("  401 → Bearer Token ou x-api-key invalide.")
    console.error("  403 → IP non autorisée (voir le point WAN IP / allowlist, plan technique section 7).")
    console.error("  404 → mauvaise URL/méthode ASMX.")
    return null
  }

  try {
    const plaintext = decryptBankSoftPayload(normalizeBankSoftCiphertext(raw), {
      key: process.env.BANKSOFT_AES_KEY!,
      iv: process.env.BANKSOFT_AES_IV!,
    })
    if (quiet) console.log(`✓ Déchiffré (${plaintext.length} caractères, contenu non affiché : données réelles)`)
    else console.log("✓ Déchiffré :", plaintext)
    // Confirmé le 03/11/2026 : le payload déchiffré est encodé en JSON deux
    // fois (une chaîne JSON contenant une chaîne JSON). Un seul JSON.parse
    // donne une chaîne de caractères — toujours un JSON "valide", d'où un
    // faux succès silencieux si on ne vérifie pas le type du résultat.
    let parsed = JSON.parse(plaintext)
    if (typeof parsed === "string") {
      console.log("  (encodé JSON deux fois — second parse appliqué)")
      parsed = JSON.parse(parsed)
    }
    if (typeof parsed !== "object" || parsed === null) {
      console.warn(`⚠ Déchiffré, mais le résultat n'est ni un objet ni une chaîne JSON imbriquée (type: ${typeof parsed}).`)
      return null
    }
    if (parsed.error || parsed.success === false) {
      console.warn(`⚠ Réponse applicative en erreur malgré HTTP 200 : ${parsed.message ?? parsed.error}`)
    }
    return parsed
  } catch (err) {
    console.error("✗ Déchiffrement/parsing échoué :", err instanceof Error ? err.message : err)
    // Diagnostic sans données réelles : longueurs et caractères hors Base64.
    const norm = normalizeBankSoftCiphertext(raw)
    const bad = [...new Set(norm.replace(/[A-Za-z0-9+/=]/g, "").split(""))].map((c) => "U+" + c.charCodeAt(0).toString(16).padStart(4, "0"))
    console.error(`  diag : brut=${raw.length} car., normalisé=${norm.length} (mod 4 = ${norm.length % 4}), octets décodés=${Buffer.from(norm, "base64").length} (mod 16 = ${Buffer.from(norm, "base64").length % 16}), caractères hors Base64 : ${bad.length ? bad.join(", ") : "aucun"}`)
    console.error(`  début brut : ${JSON.stringify(raw.slice(0, 3))}, fin brute : ${JSON.stringify(raw.slice(-3))}`)
    console.error("  Voir les commentaires de decryptBankSoftPayload (lib/banksoft/crypto.ts) pour les pistes à essayer.")
    return null
  }
}

async function main() {
  const required = ["BANKSOFT_BASE_URL", "BANKSOFT_API_KEY", "BANKSOFT_BEARER_TOKEN", "BANKSOFT_AES_KEY", "BANKSOFT_AES_IV"]
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`Variables manquantes : ${missing.join(", ")}`)
    console.error("Renseignez-les dans .env.local (voir .env.example) puis relancez.")
    process.exit(1)
  }

  const clientId = process.argv[2] ?? "CLI000001"
  console.log(`Utilisation du clientId : ${clientId}`)

  const details = await call("GetClientdetails", { clientId, requestId: `SMOKE-${Date.now()}` })
  if (!details) process.exit(1)

  const accounts = await call("GetClientAccounts", { clientId, requestId: `SMOKE-${Date.now()}-ACC` })
  const numbers: string[] = (accounts?.data?.accounts ?? []).map((a: { accountNumber: string }) => a.accountNumber.trim())
  if (!numbers.length) {
    console.warn("Aucun compte trouvé : GetAccountTransactions non testé.")
    return
  }

  // Lecture seule. Contenu non affiché (transactions réelles) : on vérifie
  // la forme et la pagination. Doc section 10 : page/limit sont des chaînes,
  // limit <= 100, requestId unique à chaque appel. Un HTTP 500 ASMX générique
  // = plantage côté serveur : on varie le compte puis les paramètres pour
  // isoler la cause (compte ? page/limit ? bug fournisseur ?).
  for (const accountNumber of numbers) {
    // Hypothèse : un ASMX appelé en JSON exige TOUS les paramètres de la méthode
    // (manquant ou en trop = 500 générique). On envoie donc la liste complète de
    // la doc section 10.1, avec des chaînes vides pour "pas de filtre".
    // Les dates au format yyyy-MM-dd (doc) donnent "Account not found" alors que
    // le même compte répond sans dates : on teste d'autres formats, sur le seul
    // compte courant (celui qui a des opérations depuis le 01/10/2026).
    if (accountNumber !== "200200000002") continue
    const noFilter = { type: "", movement: "", status: "" }
    const dates = (startDate: string, endDate: string) => ({ page: "1", limit: "5", startDate, endDate, ...noFilter })
    const variants: { extra: object; encrypt: boolean }[] = [
      { extra: dates("01/10/2026", "04/11/2026"), encrypt: false },
      { extra: dates("2026-10-01T00:00:00", "2026-11-04T23:59:59"), encrypt: false },
      { extra: dates("2026-10-01", ""), encrypt: false },
      { extra: dates("", "2026-11-04"), encrypt: false },
      { extra: dates("2020-01-01", "2030-12-31"), encrypt: false },
      { extra: dates("01-10-2026", "04-11-2026"), encrypt: false },
      { extra: dates("10/01/2026", "11/04/2026"), encrypt: false },
    ]
    for (const { extra, encrypt } of variants) {
      console.log(`\n=== Essai : compte ${accountNumber}, ${encrypt ? "corps CHIFFRÉ" : "corps clair"}, paramètres ${JSON.stringify(extra)} ===`)
      const tx = await call(
        "GetAccountTransactions",
        { accountNumber, requestId: `SMOKE-${Date.now()}-TX`, ...extra },
        true,
        encrypt
      )
      if (tx?.data) {
        console.log(`  → OK : ${tx.data.transactions?.length ?? "?"} transaction(s), pagination :`, JSON.stringify(tx.data.pagination))
        return
      }
    }
  }
  console.warn("\nGetAccountTransactions a échoué sur tous les essais : à signaler à Processware avec l'heure exacte des appels.")
}

main()
