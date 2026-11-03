// Vérifie qu'une clé API KardPay réelle (portail partenaire) fonctionne,
// avant de la brancher sur le dashboard. Ne touche à rien côté KardPay :
// GET /ping n'a besoin d'aucun scope particulier (doc section 4.5).
//
// Usage, une fois vos vraies clés en main (portail KardPay, page API keys) :
//
//   npm run kardpay:smoke-test
//
// Ce qui équivaut à mettre KARDPAY_BASE_URL / KARDPAY_KEY_ID / KARDPAY_SECRET
// dans .env.local (jamais commité, voir .env.example) et lancer :
//
//   node --env-file-if-exists=.env.local --experimental-strip-types scripts/kardpay-smoke-test.ts
//
// Ce script ne lit JAMAIS le secret depuis un argument de ligne de commande
// (visible dans l'historique shell / ps) : toujours depuis l'environnement.

// Appelle directement buildAuthorizationHeader (lib/kardpay/sign.ts, déjà
// vérifié contre les vecteurs de test officiels) plutôt que
// lib/kardpay/client.ts : ce dernier utilise une syntaxe TypeScript
// (propriétés de paramètre de constructeur) que le mode "strip-only" de
// Node ne sait pas transformer, seulement typer. Ce script reste donc
// exécutable avec --experimental-strip-types, sans étape de build.
import { buildAuthorizationHeader } from "../lib/kardpay/sign.ts"

type Envelope = { error?: { code: string; message: string } }

async function call<T>(path: string): Promise<{ status: number; data: T & Envelope }> {
  const baseUrl = process.env.KARDPAY_BASE_URL!.replace(/\/+$/, "")
  const authHeader = buildAuthorizationHeader(
    { method: "GET", path },
    { keyId: process.env.KARDPAY_KEY_ID!, secret: process.env.KARDPAY_SECRET! }
  )
  // (Pas de `cache: "no-store"` ici : ce script fait un seul appel ponctuel
  // en CLI, hors de tout contexte de cache HTTP partagé, et le type de
  // RequestInit sous Node (@types/node / undici) ne déclare pas cette
  // option, contrairement à celui du navigateur.)
  const res = await fetch(`${baseUrl}${path}`, { headers: { Authorization: authHeader } })
  const data = (await res.json().catch(() => ({}))) as T & Envelope
  return { status: res.status, data }
}

function explain(status: number, data: Envelope) {
  console.error(`✗ HTTP ${status} ${data.error?.code ?? "?"} — ${data.error?.message ?? "(pas de détail)"}`)
  if (status === 401) {
    console.error("  401 : signature invalide. Vérifiez keyId/secret, et l'horloge de cette machine")
    console.error("  (la doc rejette tout timestamp hors d'une fenêtre de 5 minutes — section 4).")
  }
  if (status === 503) {
    console.error("  503 : l'API partenaire est désactivée sur cet environnement, contactez KardPay.")
  }
}

async function main() {
  const missing = ["KARDPAY_BASE_URL", "KARDPAY_KEY_ID", "KARDPAY_SECRET"].filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`Variables manquantes : ${missing.join(", ")}`)
    console.error("Renseignez-les (voir .env.example) puis relancez.")
    process.exit(1)
  }

  console.log(`→ GET /partner/v1/ping sur ${process.env.KARDPAY_BASE_URL}`)
  const ping = await call<{ status?: string }>("/partner/v1/ping")
  if (ping.status !== 200) {
    explain(ping.status, ping.data)
    process.exit(1)
  }
  console.log(`✓ ${ping.status} ${JSON.stringify(ping.data)}`)

  // Confirme aussi que le produit attendu est bien visible pour ce compte
  // (doc section 9 — catalogue des produits signés).
  console.log("→ GET /partner/v1/products")
  const products = await call<{ data?: { product_id: string }[] }>("/partner/v1/products")
  if (products.status !== 200) {
    explain(products.status, products.data)
    console.error("  (scope cards:read requis sur cette clé)")
    return
  }
  const ids = (products.data.data ?? []).map((p) => p.product_id)
  console.log(`✓ Produits disponibles : ${ids.join(", ") || "(aucun)"}`)
  if (!ids.includes("access-finance-virtual-usd")) {
    console.warn(
      "⚠ access-finance-virtual-usd n'apparaît pas dans ce catalogue — l'émission de carte échouera (product_not_found)."
    )
  }
}

main()
