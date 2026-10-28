"use client"

import { useState } from "react"
import {
  ArrowLeftRight,
  Copy,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  Pencil,
  RefreshCw,
  Trash2,
  Unlock,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  formatAmount,
  networkLabels,
  recentTransactions,
  type VirtualCard,
} from "@/lib/cards-data"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./card-badges"
import { VirtualCardVisual } from "./virtual-card-visual"

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[168px_1fr] items-center gap-2 text-[12.5px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

const quickActions = [
  { label: "Bloquer la carte", icon: Lock, className: "border-red-200 bg-red-50/60 text-red-600 hover:bg-red-50" },
  { label: "Débloquer", icon: Unlock, className: "border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-50" },
  { label: "Modifier les limites", icon: Pencil, className: "border-blue-200 bg-blue-50/60 text-primary hover:bg-blue-50" },
  { label: "Renouveler", icon: RefreshCw, className: "border-orange-200 bg-orange-50/60 text-orange-600 hover:bg-orange-50" },
  { label: "Consulter le PIN", icon: Eye, className: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100" },
  { label: "Voir les transactions", icon: FileText, className: "border-blue-200 bg-blue-50/60 text-primary hover:bg-blue-50" },
  { label: "Réinitialiser PIN", icon: KeyRound, className: "border-purple-200 bg-purple-50/60 text-purple-600 hover:bg-purple-50" },
  { label: "Supprimer la carte", icon: Trash2, className: "border-red-200 bg-red-50/60 text-red-600 hover:bg-red-50" },
]

export function CardDetails({
  card,
  onClose,
}: {
  card: VirtualCard
  onClose: () => void
}) {
  const [showCvv, setShowCvv] = useState(false)
  const spentRate = Math.round((card.monthlySpent / card.monthlyLimit) * 1000) / 10

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Détails de la carte</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer">
          <X className="size-5" />
        </Button>
      </div>

      <VirtualCardVisual card={card} />

      <section className="space-y-3">
        <h3 className="font-semibold">Informations générales</h3>
        <dl className="space-y-1.5">
          <InfoRow label="Référence">{card.reference}</InfoRow>
          <InfoRow label="Titulaire">{card.holder}</InfoRow>
          <InfoRow label="Compte lié">
            <a href="#" className="text-primary hover:underline">
              {card.account}
            </a>
          </InfoRow>
          <InfoRow label="Type">{networkLabels[card.network]}</InfoRow>
          <InfoRow label="Devise">{card.currency}</InfoRow>
          <InfoRow label="Statut">
            <StatusBadge status={card.status} />
          </InfoRow>
          <InfoRow label="Date d'émission">{card.issuedAt}</InfoRow>
          <InfoRow label="Date d'expiration">{card.expiresAt}</InfoRow>
          <InfoRow label="CVV">
            <span className="flex items-center gap-2">
              <span className="w-8 font-mono">{showCvv ? "742" : "***"}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowCvv((v) => !v)}
                aria-label={showCvv ? "Masquer le CVV" : "Afficher le CVV"}
              >
                {showCvv ? <EyeOff /> : <Eye />}
              </Button>
              <Button variant="ghost" size="icon-xs" aria-label="Copier le CVV">
                <Copy />
              </Button>
            </span>
          </InfoRow>
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Limites et dépenses</h3>
        <dl className="space-y-1.5">
          <InfoRow label="Plafond mensuel">
            {formatAmount(card.monthlyLimit, card.currency)}
          </InfoRow>
          <InfoRow label="Montant dépensé (ce mois)">
            {formatAmount(card.monthlySpent, card.currency)}
          </InfoRow>
        </dl>
        <div className="flex items-center gap-3">
          <Progress value={spentRate} className="flex-1 [&_[data-slot=progress-track]]:h-2" />
          <span className="text-xs text-muted-foreground tabular-nums">{spentRate}%</span>
        </div>
        <dl className="space-y-1.5">
          <InfoRow label="Plafond par transaction">
            {formatAmount(card.perTransactionLimit, card.currency)}
          </InfoRow>
          <InfoRow label="Nombre de transactions">{card.transactionCount}</InfoRow>
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Actions rapides</h3>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map(({ label, icon: Icon, className }) => (
            <Button
              key={label}
              variant="outline"
              className={cn("h-9 justify-start gap-2 text-xs font-medium", className)}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Dernières transactions</h3>
          <a href="#" className="text-xs text-primary hover:underline">
            Voir tout
          </a>
        </div>
        <ul className="divide-y rounded-lg border">
          {recentTransactions.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ArrowLeftRight className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{tx.merchant}</p>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-medium text-red-600 tabular-nums">
                  - {Math.abs(tx.amount).toFixed(2)} {tx.currency}
                </p>
                <p
                  className={cn(
                    "text-[11px]",
                    tx.status === "approuvee" ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {tx.status === "approuvee" ? "Approuvée" : "Refusée"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
