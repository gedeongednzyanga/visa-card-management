// Générateur pseudo-aléatoire déterministe : les mêmes données sont produites
// côté serveur et côté client, ce qui évite les erreurs d'hydratation.
export function createRandom(seed: number) {
  let a = seed
  const next = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(items: readonly T[]) => items[Math.floor(next() * items.length)],
    weighted: <T,>(items: readonly (readonly [T, number])[]) => {
      const total = items.reduce((sum, [, w]) => sum + w, 0)
      let r = next() * total
      for (const [item, w] of items) {
        if ((r -= w) < 0) return item
      }
      return items[items.length - 1][0]
    },
  }
}

export const people = [
  "MUKENGE Jean", "KALUNGA Marie", "BIRINDWA Alain", "NTUMBA Grace", "MUTEBE David",
  "KABUYA Esther", "MUSAFIRI Patrick", "BAHATI Claude", "MAPENDO Sarah", "NSIMIRE Josée",
  "BAGALWA Eric", "CIZA Rebecca", "MUHINDO Olivier", "KAVIRA Nadine", "LUKUSA Benjamin",
  "ILUNGA Christelle", "MWAMBA Fiston", "AMANI Divine", "BUHENDWA Samuel", "ZAWADI Ruth",
  "KASONGO Henri", "MASIKA Clarisse", "BISIMWA Junior", "FURAHA Aline", "NGOY Trésor",
] as const

export const companies = [
  "SARL KIVU TRADE", "ENTREPRISE BuildCo", "Association Amani", "ETS Lumière & Fils",
  "SOCODE Transport", "Coopérative Tujenge", "Hôtel Lac Kivu", "AgroNord SARL",
] as const

export const cities = ["Goma", "Bukavu", "Kinshasa", "Lubumbashi", "Uvira", "Butembo"] as const

export const agencies = ["Goma Centre", "Bukavu Ibanda", "Kinshasa Gombe", "Lubumbashi", "Uvira"] as const

/** Date jj/mm/aaaa, n jours avant le 20/10/2026. */
export function daysAgo(n: number, withTime = false, rand?: () => number) {
  const d = new Date(Date.UTC(2026, 9, 20 - n))
  const date = d.toLocaleDateString("fr-FR", { timeZone: "UTC" })
  if (!withTime) return date
  const minutes = Math.floor((rand?.() ?? 0.5) * 14 * 60) + 7 * 60
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0")
  const mm = String(minutes % 60).padStart(2, "0")
  return `${date} ${hh}:${mm}`
}

export function pad(n: number, width: number) {
  return String(n).padStart(width, "0")
}
