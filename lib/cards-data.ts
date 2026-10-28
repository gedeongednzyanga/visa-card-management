// Données fictives pour le frontend — à remplacer par l'API.

export type CardStatus = "active" | "bloquee" | "en-attente" | "expiree"
export type CardNetwork = "visa" | "mastercard"
export type Currency = "USD" | "CDF"

export type VirtualCard = {
  reference: string
  holder: string
  account: string
  last4: string
  network: CardNetwork
  currency: Currency
  status: CardStatus
  issuedAt: string
  expiresAt: string
  monthlyLimit: number
  monthlySpent: number
  perTransactionLimit: number
  transactionCount: number
}

export type CardTransaction = {
  id: string
  merchant: string
  date: string
  amount: number
  currency: Currency
  status: "approuvee" | "refusee"
}

export const statusLabels: Record<CardStatus, string> = {
  active: "Active",
  bloquee: "Bloquée",
  "en-attente": "En attente",
  expiree: "Expirée",
}

export const networkLabels: Record<CardNetwork, string> = {
  visa: "Visa Virtual",
  mastercard: "Mastercard Virtual",
}

export const cardStats = {
  total: 1248,
  totalGrowth: 12,
  active: 1032,
  activeRate: 82.7,
  blocked: 48,
  blockedRate: 3.8,
  pending: 76,
  pendingRate: 6.1,
}

export const statusDistribution: {
  status: CardStatus
  label: string
  value: number
}[] = [
  { status: "active", label: "Actives", value: 82.7 },
  { status: "bloquee", label: "Bloquées", value: 3.8 },
  { status: "en-attente", label: "En attente", value: 6.1 },
  { status: "expiree", label: "Expirées", value: 7.4 },
]

const emissionCounts = [
  12, 13, 11, 13, 12, 11, 11, 13, 11, 12, 13, 15, 14, 17, 25, 18, 22, 19, 22,
  20, 23, 22, 21, 35, 22, 24, 28, 20, 26, 29,
]

// 30 derniers jours, du 20/09/2026 au 19/10/2026
export const emissionsData = emissionCounts.map((count, i) => {
  const date = new Date(Date.UTC(2026, 8, 20 + i))
  return {
    date: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }),
    count,
  }
})

export const virtualCards: VirtualCard[] = [
  {
    reference: "VC-20261020-001",
    holder: "MUKENGE Jean",
    account: "200200001234",
    last4: "4582",
    network: "visa",
    currency: "USD",
    status: "active",
    issuedAt: "20/10/2026",
    expiresAt: "20/10/2029",
    monthlyLimit: 5000,
    monthlySpent: 1240,
    perTransactionLimit: 1000,
    transactionCount: 18,
  },
  {
    reference: "VC-20261020-002",
    holder: "KALUNGA Marie",
    account: "200200001567",
    last4: "7713",
    network: "visa",
    currency: "USD",
    status: "active",
    issuedAt: "19/10/2026",
    expiresAt: "19/10/2029",
    monthlyLimit: 3000,
    monthlySpent: 450,
    perTransactionLimit: 500,
    transactionCount: 6,
  },
  {
    reference: "VC-20261019-003",
    holder: "SARL KIVU TRADE",
    account: "200200009876",
    last4: "9921",
    network: "mastercard",
    currency: "USD",
    status: "bloquee",
    issuedAt: "18/10/2026",
    expiresAt: "18/10/2029",
    monthlyLimit: 20000,
    monthlySpent: 8900,
    perTransactionLimit: 5000,
    transactionCount: 42,
  },
  {
    reference: "VC-20261019-004",
    holder: "BIRINDWA Alain",
    account: "200200004321",
    last4: "3345",
    network: "visa",
    currency: "CDF",
    status: "active",
    issuedAt: "18/10/2026",
    expiresAt: "18/10/2029",
    monthlyLimit: 2500000,
    monthlySpent: 320000,
    perTransactionLimit: 500000,
    transactionCount: 9,
  },
  {
    reference: "VC-20261018-005",
    holder: "NTUMBA Grace",
    account: "200200006789",
    last4: "6678",
    network: "mastercard",
    currency: "USD",
    status: "en-attente",
    issuedAt: "17/10/2026",
    expiresAt: "17/10/2029",
    monthlyLimit: 2000,
    monthlySpent: 0,
    perTransactionLimit: 500,
    transactionCount: 0,
  },
  {
    reference: "VC-20261018-006",
    holder: "Association Amani",
    account: "200200009111",
    last4: "1209",
    network: "visa",
    currency: "USD",
    status: "active",
    issuedAt: "17/10/2026",
    expiresAt: "17/10/2029",
    monthlyLimit: 10000,
    monthlySpent: 6150,
    perTransactionLimit: 2000,
    transactionCount: 27,
  },
  {
    reference: "VC-20261017-007",
    holder: "MUTEBE David",
    account: "200200003456",
    last4: "8890",
    network: "visa",
    currency: "CDF",
    status: "expiree",
    issuedAt: "15/10/2026",
    expiresAt: "15/10/2027",
    monthlyLimit: 1500000,
    monthlySpent: 0,
    perTransactionLimit: 300000,
    transactionCount: 0,
  },
  {
    reference: "VC-20261017-008",
    holder: "KABUYA Esther",
    account: "200200007654",
    last4: "2211",
    network: "mastercard",
    currency: "USD",
    status: "active",
    issuedAt: "15/10/2026",
    expiresAt: "15/10/2029",
    monthlyLimit: 4000,
    monthlySpent: 980,
    perTransactionLimit: 800,
    transactionCount: 11,
  },
  {
    reference: "VC-20261016-009",
    holder: "ENTREPRISE BuildCo",
    account: "200200008222",
    last4: "4456",
    network: "visa",
    currency: "USD",
    status: "active",
    issuedAt: "14/10/2026",
    expiresAt: "14/10/2029",
    monthlyLimit: 25000,
    monthlySpent: 14300,
    perTransactionLimit: 5000,
    transactionCount: 63,
  },
  {
    reference: "VC-20261016-010",
    holder: "MUSAFIRI Patrick",
    account: "200200009333",
    last4: "9934",
    network: "mastercard",
    currency: "USD",
    status: "bloquee",
    issuedAt: "14/10/2026",
    expiresAt: "14/10/2029",
    monthlyLimit: 3000,
    monthlySpent: 2875,
    perTransactionLimit: 1000,
    transactionCount: 22,
  },
]

export const recentTransactions: CardTransaction[] = [
  {
    id: "TX-0001",
    merchant: "Achat en ligne",
    date: "20/10/2026 14:32",
    amount: -45,
    currency: "USD",
    status: "approuvee",
  },
  {
    id: "TX-0002",
    merchant: "Netflix",
    date: "19/10/2026 20:15",
    amount: -12.99,
    currency: "USD",
    status: "approuvee",
  },
  {
    id: "TX-0003",
    merchant: "Amazon",
    date: "18/10/2026 11:20",
    amount: -85.5,
    currency: "USD",
    status: "approuvee",
  },
]

export function formatAmount(value: number, currency: Currency) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "USD" && !Number.isInteger(value) ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value)} ${currency}`
}
