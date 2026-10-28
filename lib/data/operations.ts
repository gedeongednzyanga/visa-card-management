import { virtualCards, type CardNetwork } from "@/lib/cards-data"
import { accounts, type Currency } from "./clients"
import { agencies, createRandom, daysAgo, pad, people } from "./seed"

// ---------- Transactions bancaires ----------

export type TransactionType = "virement" | "depot" | "retrait" | "paiement-carte" | "frais"
export type TransactionChannel = "agence" | "mobile" | "carte" | "en-ligne"
export type TransactionStatus = "reussie" | "en-attente" | "echouee"

export type Transaction = {
  id: string
  date: string
  account: string
  holder: string
  type: TransactionType
  channel: TransactionChannel
  description: string
  amount: number
  currency: Currency
  status: TransactionStatus
}

export const transactionTypeLabels: Record<TransactionType, string> = {
  virement: "Virement",
  depot: "Dépôt",
  retrait: "Retrait",
  "paiement-carte": "Paiement carte",
  frais: "Frais bancaires",
}

export const channelLabels: Record<TransactionChannel, string> = {
  agence: "Agence",
  mobile: "Mobile banking",
  carte: "Carte",
  "en-ligne": "Banque en ligne",
}

export const transactionStatusLabels: Record<TransactionStatus, string> = {
  reussie: "Réussie",
  "en-attente": "En attente",
  echouee: "Échouée",
}

const descriptions: Record<TransactionType, string[]> = {
  virement: ["Virement salaire", "Virement fournisseur", "Transfert vers épargne", "Paiement loyer"],
  depot: ["Dépôt espèces", "Dépôt chèque", "Versement agence"],
  retrait: ["Retrait guichet", "Retrait GAB"],
  "paiement-carte": ["Achat en ligne", "Paiement marchand", "Abonnement"],
  frais: ["Frais de tenue de compte", "Frais carte virtuelle", "Commission virement"],
}

const rand = createRandom(7)
const activeAccounts = accounts.filter((a) => a.status !== "cloture")

export const transactions: Transaction[] = Array.from({ length: 64 }, (_, i) => {
  const account = rand.pick(activeAccounts)
  const type = rand.weighted<TransactionType>([
    ["virement", 4], ["depot", 3], ["retrait", 3], ["paiement-carte", 4], ["frais", 1],
  ])
  const channel: TransactionChannel =
    type === "paiement-carte" ? "carte" : type === "frais" ? "en-ligne" : rand.pick(["agence", "mobile", "en-ligne"] as const)
  const sign = type === "depot" ? 1 : type === "virement" && rand.next() > 0.5 ? 1 : -1
  const raw = type === "frais" ? rand.int(1, 15) : rand.int(10, 3500) + rand.int(0, 99) / 100
  return {
    id: `TRX-${pad(982341 - i * 17, 7)}`,
    date: daysAgo(Math.floor(i / 4), true, rand.next),
    account: account.number,
    holder: account.holder,
    type,
    channel,
    description: rand.pick(descriptions[type]),
    amount: sign * raw * (account.currency === "CDF" ? 2800 : 1),
    currency: account.currency,
    status: rand.weighted<TransactionStatus>([["reussie", 14], ["en-attente", 2], ["echouee", 1]]),
  }
})

export const transactionStats = {
  today: 1842,
  volumeUsd: 486_230,
  pending: 37,
  failedRate: 1.8,
}

// ---------- Transactions cartes ----------

export type CardTxStatus = "approuvee" | "refusee" | "en-attente"

export type CardTransactionRow = {
  id: string
  date: string
  cardRef: string
  last4: string
  network: CardNetwork
  holder: string
  merchant: string
  category: string
  country: string
  amount: number
  currency: Currency
  status: CardTxStatus
}

export const cardTxStatusLabels: Record<CardTxStatus, string> = {
  approuvee: "Approuvée",
  refusee: "Refusée",
  "en-attente": "En attente",
}

const merchants = [
  ["Amazon", "E-commerce", "États-Unis"],
  ["Netflix", "Abonnement", "Pays-Bas"],
  ["AliExpress", "E-commerce", "Chine"],
  ["Spotify", "Abonnement", "Suède"],
  ["Booking.com", "Voyage", "Pays-Bas"],
  ["Google Cloud", "Services en ligne", "Irlande"],
  ["Jumia", "E-commerce", "Nigeria"],
  ["Ethiopian Airlines", "Voyage", "Éthiopie"],
  ["Microsoft 365", "Abonnement", "Irlande"],
  ["Apple", "Services en ligne", "Irlande"],
] as const

const usableCards = virtualCards.filter((c) => c.status !== "en-attente")

export const cardTransactions: CardTransactionRow[] = Array.from({ length: 48 }, (_, i) => {
  const card = rand.pick(usableCards)
  const [merchant, category, country] = rand.pick(merchants)
  const amount = rand.int(3, 450) + rand.pick([0, 0.49, 0.99, 0.5])
  return {
    id: `CTX-${pad(55021 - i * 13, 6)}`,
    date: daysAgo(Math.floor(i / 3), true, rand.next),
    cardRef: card.reference,
    last4: card.last4,
    network: card.network,
    holder: card.holder,
    merchant,
    category,
    country,
    amount: -amount * (card.currency === "CDF" ? 2800 : 1),
    currency: card.currency,
    status:
      card.status !== "active"
        ? "refusee"
        : rand.weighted<CardTxStatus>([["approuvee", 12], ["refusee", 1], ["en-attente", 1]]),
  }
})

export const cardTxStats = {
  count: 3214,
  volumeUsd: 128_450,
  declined: 74,
  averageUsd: 39.96,
}

// ---------- Demandes de cartes ----------

export type RequestStatus = "en-attente" | "approuvee" | "rejetee"

export type CardRequest = {
  id: string
  client: string
  account: string
  network: CardNetwork
  currency: Currency
  monthlyLimit: number
  requestedAt: string
  channel: "Agence" | "Mobile banking" | "Banque en ligne"
  agent: string
  status: RequestStatus
}

export const requestStatusLabels: Record<RequestStatus, string> = {
  "en-attente": "En attente",
  approuvee: "Approuvée",
  rejetee: "Rejetée",
}

const agents = ["Daniel Balinda", "Sylvie Kahindo", "Moïse Kambale", "Pascal Mirindi"]

export const cardRequests: CardRequest[] = Array.from({ length: 26 }, (_, i) => {
  const account = rand.pick(activeAccounts)
  return {
    id: `DEM-${pad(4120 - i * 3, 5)}`,
    client: account.holder,
    account: account.number,
    network: rand.next() > 0.45 ? "visa" : "mastercard",
    currency: account.currency,
    monthlyLimit: rand.pick([1000, 2000, 3000, 5000, 10000]) * (account.currency === "CDF" ? 2800 : 1),
    requestedAt: daysAgo(Math.floor(i / 2), true, rand.next),
    channel: rand.pick(["Agence", "Mobile banking", "Banque en ligne"] as const),
    agent: rand.pick(agents),
    status: i < 9 ? "en-attente" : rand.weighted<RequestStatus>([["approuvee", 4], ["rejetee", 1]]),
  }
})

// ---------- Historique blocage / déblocage ----------

export type BlockEvent = {
  id: string
  date: string
  cardRef: string
  holder: string
  last4: string
  action: "blocage" | "deblocage"
  reason: string
  by: string
}

const blockReasons = [
  "Suspicion de fraude",
  "Demande du client",
  "Carte compromise",
  "Plafond dépassé",
  "Vérification KYC",
]

export const blockHistory: BlockEvent[] = Array.from({ length: 14 }, (_, i) => {
  const card = rand.pick(virtualCards)
  const action = rand.next() > 0.4 ? "blocage" : "deblocage"
  return {
    id: `BLK-${pad(880 - i, 4)}`,
    date: daysAgo(i, true, rand.next),
    cardRef: card.reference,
    holder: card.holder,
    last4: card.last4,
    action,
    reason: action === "blocage" ? rand.pick(blockReasons) : "Vérification effectuée",
    by: rand.pick(agents),
  }
})

// ---------- Gestion des risques ----------

export type AlertSeverity = "critique" | "elevee" | "moyenne" | "faible"
export type AlertStatus = "nouvelle" | "en-cours" | "resolue" | "faux-positif"

export type RiskAlert = {
  id: string
  date: string
  client: string
  target: string
  rule: string
  amount: string
  score: number
  severity: AlertSeverity
  status: AlertStatus
}

export const severityLabels: Record<AlertSeverity, string> = {
  critique: "Critique",
  elevee: "Élevée",
  moyenne: "Moyenne",
  faible: "Faible",
}

export const alertStatusLabels: Record<AlertStatus, string> = {
  nouvelle: "Nouvelle",
  "en-cours": "En cours",
  resolue: "Résolue",
  "faux-positif": "Faux positif",
}

const rules = [
  "Montant inhabituel",
  "Pays à risque",
  "Multiples échecs CVV",
  "Transactions rapprochées",
  "Nouveau marchand à risque",
  "Connexion depuis un nouvel appareil",
]

export const riskAlerts: RiskAlert[] = Array.from({ length: 30 }, (_, i) => {
  const score = rand.int(35, 99)
  const severity: AlertSeverity =
    score >= 90 ? "critique" : score >= 75 ? "elevee" : score >= 55 ? "moyenne" : "faible"
  const card = rand.pick(virtualCards)
  return {
    id: `ALR-${pad(7310 - i * 7, 5)}`,
    date: daysAgo(Math.floor(i / 3), true, rand.next),
    client: rand.next() > 0.3 ? card.holder : rand.pick(people),
    target: `Carte **** ${card.last4}`,
    rule: rand.pick(rules),
    amount: `${rand.int(150, 4800)} USD`,
    score,
    severity,
    status: i < 6 ? "nouvelle" : rand.weighted<AlertStatus>([["en-cours", 2], ["resolue", 4], ["faux-positif", 1]]),
  }
})

export const riskByRule = rules.map((rule) => ({
  rule,
  count: riskAlerts.filter((a) => a.rule === rule).length,
}))

// ---------- Rapports ----------

export type Report = {
  id: string
  name: string
  category: "Cartes" | "Transactions" | "Clients" | "Risques" | "Comptabilité"
  period: string
  generatedAt: string
  format: "PDF" | "XLSX" | "CSV"
  size: string
}

export const reports: Report[] = [
  { id: "RPT-0921", name: "Rapport mensuel des cartes virtuelles", category: "Cartes", period: "Septembre 2026", generatedAt: "01/10/2026 06:00", format: "PDF", size: "1,2 Mo" },
  { id: "RPT-0920", name: "Journal des transactions", category: "Transactions", period: "Septembre 2026", generatedAt: "01/10/2026 06:00", format: "XLSX", size: "8,4 Mo" },
  { id: "RPT-0919", name: "Alertes de fraude et résolutions", category: "Risques", period: "Septembre 2026", generatedAt: "01/10/2026 06:05", format: "PDF", size: "640 Ko" },
  { id: "RPT-0918", name: "Nouveaux clients et KYC", category: "Clients", period: "Septembre 2026", generatedAt: "01/10/2026 06:05", format: "CSV", size: "320 Ko" },
  { id: "RPT-0917", name: "Balance générale des comptes", category: "Comptabilité", period: "Septembre 2026", generatedAt: "01/10/2026 06:10", format: "XLSX", size: "2,9 Mo" },
  { id: "RPT-0916", name: "Rapport mensuel des cartes virtuelles", category: "Cartes", period: "Août 2026", generatedAt: "01/09/2026 06:00", format: "PDF", size: "1,1 Mo" },
  { id: "RPT-0915", name: "Journal des transactions", category: "Transactions", period: "Août 2026", generatedAt: "01/09/2026 06:00", format: "XLSX", size: "7,9 Mo" },
  { id: "RPT-0914", name: "Alertes de fraude et résolutions", category: "Risques", period: "Août 2026", generatedAt: "01/09/2026 06:05", format: "PDF", size: "590 Ko" },
  { id: "RPT-0913", name: "Nouveaux clients et KYC", category: "Clients", period: "Août 2026", generatedAt: "01/09/2026 06:05", format: "CSV", size: "298 Ko" },
  { id: "RPT-0912", name: "Balance générale des comptes", category: "Comptabilité", period: "Août 2026", generatedAt: "01/09/2026 06:10", format: "XLSX", size: "2,8 Mo" },
  { id: "RPT-0911", name: "Rapport trimestriel BCC", category: "Comptabilité", period: "T2 2026", generatedAt: "05/07/2026 09:30", format: "PDF", size: "3,6 Mo" },
  { id: "RPT-0910", name: "Rapport mensuel des cartes virtuelles", category: "Cartes", period: "Juillet 2026", generatedAt: "01/08/2026 06:00", format: "PDF", size: "1,0 Mo" },
]

export const monthlyActivity = [
  { month: "Mai", cartes: 82, transactions: 21400, volume: 312 },
  { month: "Juin", cartes: 95, transactions: 23800, volume: 341 },
  { month: "Juil.", cartes: 110, transactions: 25100, volume: 368 },
  { month: "Août", cartes: 104, transactions: 26900, volume: 395 },
  { month: "Sept.", cartes: 131, transactions: 29400, volume: 431 },
  { month: "Oct.", cartes: 148, transactions: 31800, volume: 486 },
]

// ---------- Utilisateurs ----------

export type UserRole = "Administrateur" | "Superviseur" | "Agent" | "Analyste risques" | "Auditeur"

export type AppUser = {
  id: string
  name: string
  initials: string
  email: string
  role: UserRole
  agency: string
  lastLogin: string
  active: boolean
}

export const users: AppUser[] = [
  ["Daniel Balinda", "Administrateur", "Goma Centre"],
  ["Sylvie Kahindo", "Superviseur", "Goma Centre"],
  ["Moïse Kambale", "Agent", "Bukavu Ibanda"],
  ["Pascal Mirindi", "Agent", "Uvira"],
  ["Esther Nabintu", "Analyste risques", "Goma Centre"],
  ["Jonathan Mbuyi", "Agent", "Kinshasa Gombe"],
  ["Aimée Kasereka", "Superviseur", "Kinshasa Gombe"],
  ["Gloire Mukenga", "Auditeur", "Lubumbashi"],
  ["Rachel Uwimana", "Agent", agencies[0]],
  ["Serge Lwaboshi", "Analyste risques", "Bukavu Ibanda"],
].map(([name, role, agency], i) => ({
  id: `USR-${pad(i + 1, 3)}`,
  name,
  initials: name.split(" ").map((p) => p[0]).join(""),
  email: `${name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@accesfinance.cd`,
  role: role as UserRole,
  agency,
  lastLogin: daysAgo(i % 4, true, rand.next),
  active: i !== 7,
}))

export const rolePermissions: { role: UserRole; description: string; permissions: string[] }[] = [
  { role: "Administrateur", description: "Accès complet à la plateforme", permissions: ["Tout"] },
  { role: "Superviseur", description: "Valide les demandes et les limites", permissions: ["Cartes", "Comptes", "Validation", "Rapports"] },
  { role: "Agent", description: "Opérations courantes en agence", permissions: ["Clients", "Comptes", "Demandes de carte"] },
  { role: "Analyste risques", description: "Suivi des alertes de fraude", permissions: ["Risques", "Blocage", "Transactions"] },
  { role: "Auditeur", description: "Consultation en lecture seule", permissions: ["Lecture seule", "Rapports"] },
]
