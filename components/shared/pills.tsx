import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Info,
  Lock,
  Snowflake,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import {
  accountStatusLabels,
  kycLabels,
  type AccountStatus,
  type KycStatus,
} from "@/lib/data/clients"
import {
  alertStatusLabels,
  cardTxStatusLabels,
  requestStatusLabels,
  severityLabels,
  transactionStatusLabels,
  type AlertSeverity,
  type AlertStatus,
  type CardTxStatus,
  type RequestStatus,
  type TransactionStatus,
} from "@/lib/data/operations"
import { StatusPill, type Tone } from "./status-pill"

type PillDef = { tone: Tone; icon?: LucideIcon }

function makePill<K extends string>(labels: Record<K, string>, defs: Record<K, PillDef>) {
  return function Pill({ value, className }: { value: K; className?: string }) {
    const { tone, icon } = defs[value]
    return (
      <StatusPill tone={tone} icon={icon} className={className}>
        {labels[value]}
      </StatusPill>
    )
  }
}

export const KycPill = makePill<KycStatus>(kycLabels, {
  verifie: { tone: "success", icon: CheckCircle2 },
  "en-cours": { tone: "warning", icon: Clock },
  rejete: { tone: "danger", icon: XCircle },
})

export const AccountStatusPill = makePill<AccountStatus>(accountStatusLabels, {
  actif: { tone: "success", icon: CheckCircle2 },
  gele: { tone: "info", icon: Snowflake },
  cloture: { tone: "neutral", icon: Ban },
})

export const TransactionStatusPill = makePill<TransactionStatus>(transactionStatusLabels, {
  reussie: { tone: "success", icon: CheckCircle2 },
  "en-attente": { tone: "warning", icon: Clock },
  echouee: { tone: "danger", icon: XCircle },
})

export const CardTxStatusPill = makePill<CardTxStatus>(cardTxStatusLabels, {
  approuvee: { tone: "success", icon: CheckCircle2 },
  "en-attente": { tone: "warning", icon: Clock },
  refusee: { tone: "danger", icon: XCircle },
})

export const RequestStatusPill = makePill<RequestStatus>(requestStatusLabels, {
  "en-attente": { tone: "warning", icon: Clock },
  approuvee: { tone: "success", icon: CheckCircle2 },
  rejetee: { tone: "danger", icon: XCircle },
})

export const SeverityPill = makePill<AlertSeverity>(severityLabels, {
  critique: { tone: "danger", icon: AlertOctagon },
  elevee: { tone: "warning", icon: AlertTriangle },
  moyenne: { tone: "purple", icon: Info },
  faible: { tone: "neutral", icon: Info },
})

export const AlertStatusPill = makePill<AlertStatus>(alertStatusLabels, {
  nouvelle: { tone: "danger" },
  "en-cours": { tone: "warning" },
  resolue: { tone: "success" },
  "faux-positif": { tone: "neutral" },
})

export const ActivePill = ({ active }: { active: boolean }) =>
  active ? (
    <StatusPill tone="success" icon={CheckCircle2}>Actif</StatusPill>
  ) : (
    <StatusPill tone="neutral" icon={Lock}>Inactif</StatusPill>
  )
