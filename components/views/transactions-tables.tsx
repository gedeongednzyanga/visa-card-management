"use client"

import { NetworkLogo } from "@/components/cards/card-badges"
import { DataTable, type Column } from "@/components/shared/data-table"
import { CardTxStatusPill, TransactionStatusPill } from "@/components/shared/pills"
import {
  cardTransactions,
  cardTxStatusLabels,
  channelLabels,
  transactions,
  transactionStatusLabels,
  transactionTypeLabels,
  type CardTransactionRow,
  type Transaction,
} from "@/lib/data/operations"
import { formatSigned } from "@/lib/format"
import { cn } from "@/lib/utils"

function Amount({ value, currency }: { value: number; currency: "USD" | "CDF" }) {
  return (
    <span className={cn("font-medium tabular-nums", value < 0 ? "text-red-600" : "text-emerald-600")}>
      {formatSigned(value, currency)}
    </span>
  )
}

const cardColumns: Column<CardTransactionRow>[] = [
  { header: "ID", cell: (t) => <span className="text-primary">{t.id}</span> },
  { header: "Date", cell: (t) => t.date },
  {
    header: "Carte",
    cell: (t) => (
      <span className="flex items-center gap-2">
        <span className="flex w-6 justify-center">
          <NetworkLogo network={t.network} />
        </span>
        <span>
          <span className="block font-medium">{t.holder}</span>
          <span className="block text-muted-foreground">**** {t.last4}</span>
        </span>
      </span>
    ),
  },
  { header: "Marchand", cell: (t) => <span className="font-medium">{t.merchant}</span> },
  { header: "Catégorie", cell: (t) => t.category },
  { header: "Pays", cell: (t) => t.country },
  { header: "Montant", className: "text-right", cell: (t) => <Amount value={t.amount} currency={t.currency} /> },
  { header: "Statut", cell: (t) => <CardTxStatusPill value={t.status} className="text-[10.5px]" /> },
]

export function CardTransactionsTable() {
  return (
    <DataTable
      title="Transactions cartes"
      data={cardTransactions}
      columns={cardColumns}
      rowKey={(t) => t.id}
      itemLabel="transactions"
      searchPlaceholder="Rechercher par marchand, client, carte..."
      searchText={(t) => `${t.id} ${t.merchant} ${t.holder} ${t.last4} ${t.cardRef}`}
      filters={[
        {
          id: "status",
          allLabel: "Tous les statuts",
          options: Object.entries(cardTxStatusLabels).map(([value, label]) => ({ value, label })),
          getValue: (t) => t.status,
        },
        {
          id: "category",
          allLabel: "Toutes les catégories",
          options: [...new Set(cardTransactions.map((t) => t.category))].sort().map((v) => ({ value: v, label: v })),
          getValue: (t) => t.category,
        },
        {
          id: "network",
          allLabel: "Tous les réseaux",
          options: [{ value: "visa", label: "Visa" }, { value: "mastercard", label: "Mastercard" }],
          getValue: (t) => t.network,
        },
      ]}
    />
  )
}

const txColumns: Column<Transaction>[] = [
  { header: "ID", cell: (t) => <span className="text-primary">{t.id}</span> },
  { header: "Date", cell: (t) => t.date },
  {
    header: "Compte",
    cell: (t) => (
      <>
        <span className="block font-medium">{t.holder}</span>
        <span className="block text-muted-foreground">{t.account}</span>
      </>
    ),
  },
  { header: "Type", cell: (t) => transactionTypeLabels[t.type] },
  { header: "Description", cell: (t) => t.description },
  { header: "Canal", cell: (t) => channelLabels[t.channel] },
  { header: "Montant", className: "text-right", cell: (t) => <Amount value={t.amount} currency={t.currency} /> },
  { header: "Statut", cell: (t) => <TransactionStatusPill value={t.status} className="text-[10.5px]" /> },
]

export function TransactionsTable() {
  return (
    <DataTable
      title="Toutes les transactions"
      data={transactions}
      columns={txColumns}
      rowKey={(t) => t.id}
      itemLabel="transactions"
      searchPlaceholder="Rechercher par ID, compte, titulaire..."
      searchText={(t) => `${t.id} ${t.account} ${t.holder} ${t.description}`}
      filters={[
        {
          id: "type",
          allLabel: "Tous les types",
          options: Object.entries(transactionTypeLabels).map(([value, label]) => ({ value, label })),
          getValue: (t) => t.type,
        },
        {
          id: "channel",
          allLabel: "Tous les canaux",
          options: Object.entries(channelLabels).map(([value, label]) => ({ value, label })),
          getValue: (t) => t.channel,
        },
        {
          id: "status",
          allLabel: "Tous les statuts",
          options: Object.entries(transactionStatusLabels).map(([value, label]) => ({ value, label })),
          getValue: (t) => t.status,
        },
        {
          id: "currency",
          allLabel: "Toutes les devises",
          options: [{ value: "USD", label: "USD" }, { value: "CDF", label: "CDF" }],
          getValue: (t) => t.currency,
        },
      ]}
    />
  )
}
