import type { Currency } from "@/lib/cards-data"
import { agencies, cities, companies, createRandom, daysAgo, pad, people } from "./seed"

export type { Currency }

export type ClientType = "particulier" | "entreprise"
export type KycStatus = "verifie" | "en-cours" | "rejete"

export type Client = {
  id: string
  name: string
  type: ClientType
  phone: string
  email: string
  city: string
  kyc: KycStatus
  accounts: number
  cards: number
  createdAt: string
  active: boolean
}

export type AccountType = "courant" | "epargne" | "entreprise"
export type AccountStatus = "actif" | "gele" | "cloture"

export type Account = {
  number: string
  holder: string
  clientId: string
  type: AccountType
  currency: Currency
  balance: number
  status: AccountStatus
  agency: string
  openedAt: string
}

export const kycLabels: Record<KycStatus, string> = {
  verifie: "Vérifié",
  "en-cours": "En cours",
  rejete: "Rejeté",
}

export const accountTypeLabels: Record<AccountType, string> = {
  courant: "Compte courant",
  epargne: "Compte épargne",
  entreprise: "Compte entreprise",
}

export const accountStatusLabels: Record<AccountStatus, string> = {
  actif: "Actif",
  gele: "Gelé",
  cloture: "Clôturé",
}

function slug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "")
}

const rand = createRandom(42)

export const clients: Client[] = [
  ...people.map((name) => ({ name, type: "particulier" as const })),
  ...companies.map((name) => ({ name, type: "entreprise" as const })),
]
  .map(({ name, type }, i) => {
    const kyc = rand.weighted<KycStatus>([["verifie", 8], ["en-cours", 2], ["rejete", 1]])
    return {
      id: `CL-${pad(1024 + i * 37, 6)}`,
      name,
      type,
      phone: `+243 ${rand.pick(["97", "99", "81", "82", "85"])}${rand.int(1000000, 9999999)}`,
      email: `${slug(name)}@${type === "entreprise" ? "entreprise.cd" : "gmail.com"}`,
      city: rand.pick(cities),
      kyc,
      accounts: type === "entreprise" ? rand.int(1, 4) : rand.int(1, 2),
      cards: kyc === "verifie" ? rand.int(0, 3) : 0,
      createdAt: daysAgo(rand.int(3, 900)),
      active: kyc !== "rejete" && rand.next() > 0.08,
    }
  })
  .sort((a, b) => b.id.localeCompare(a.id))

export const accounts: Account[] = clients.flatMap((client, i) =>
  Array.from({ length: client.accounts }, (_, j) => {
    const type: AccountType =
      client.type === "entreprise" ? "entreprise" : j === 0 ? "courant" : "epargne"
    const currency: Currency = rand.next() > 0.3 ? "USD" : "CDF"
    const base = type === "entreprise" ? 60000 : 4000
    return {
      number: `2002000${pad(10000 + i * 211 + j * 7, 5)}`,
      holder: client.name,
      clientId: client.id,
      type,
      currency,
      balance: Math.round(rand.next() * base * (currency === "CDF" ? 2800 : 1) * 100) / 100,
      status: rand.weighted<AccountStatus>([["actif", 12], ["gele", 1], ["cloture", 1]]),
      agency: rand.pick(agencies),
      openedAt: daysAgo(rand.int(3, 900)),
    }
  })
)

export const clientStats = {
  total: 8642,
  individuals: 7915,
  companies: 727,
  newThisMonth: 214,
  kycPending: 96,
}

export const accountStats = {
  total: 11380,
  balanceUsd: 18_420_560,
  balanceCdf: 9_850_000_000,
  frozen: 37,
  openedThisMonth: 268,
}
