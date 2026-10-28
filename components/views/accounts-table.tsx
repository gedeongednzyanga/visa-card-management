"use client"

import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, type Column } from "@/components/shared/data-table"
import { AccountStatusPill } from "@/components/shared/pills"
import {
  accounts,
  accountStatusLabels,
  accountTypeLabels,
  type Account,
} from "@/lib/data/clients"
import { agencies } from "@/lib/data/seed"
import { formatAmount } from "@/lib/format"

const columns: Column<Account>[] = [
  { header: "Numéro de compte", cell: (a) => <span className="text-primary">{a.number}</span> },
  {
    header: "Titulaire",
    cell: (a) => (
      <>
        <span className="block font-medium">{a.holder}</span>
        <span className="block text-muted-foreground">{a.clientId}</span>
      </>
    ),
  },
  { header: "Type", cell: (a) => accountTypeLabels[a.type] },
  { header: "Devise", cell: (a) => a.currency },
  {
    header: "Solde",
    className: "text-right",
    cell: (a) => <span className="font-medium tabular-nums">{formatAmount(a.balance, a.currency)}</span>,
  },
  { header: "Agence", cell: (a) => a.agency },
  { header: "Statut", cell: (a) => <AccountStatusPill value={a.status} className="text-[10.5px]" /> },
  { header: "Ouverture", cell: (a) => a.openedAt },
  {
    header: "Actions",
    className: "text-center",
    cell: (a) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="icon-sm" className="h-6 w-8" aria-label={`Actions pour ${a.number}`} />}
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => toast.info(`Relevé du compte ${a.number} généré`)}>
            Télécharger le relevé
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.info(`Ouverture du compte ${a.number}`)}>
            Voir les opérations
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => toast.warning(`Compte ${a.number} gelé`)}>
            Geler le compte
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function AccountsTable() {
  return (
    <DataTable
      title="Liste des comptes"
      data={accounts}
      columns={columns}
      rowKey={(a) => a.number}
      itemLabel="comptes"
      searchPlaceholder="Rechercher par numéro, titulaire, ID client..."
      searchText={(a) => `${a.number} ${a.holder} ${a.clientId}`}
      filters={[
        {
          id: "type",
          allLabel: "Tous les types",
          options: Object.entries(accountTypeLabels).map(([value, label]) => ({ value, label })),
          getValue: (a) => a.type,
        },
        {
          id: "currency",
          allLabel: "Toutes les devises",
          options: [{ value: "USD", label: "USD" }, { value: "CDF", label: "CDF" }],
          getValue: (a) => a.currency,
        },
        {
          id: "status",
          allLabel: "Tous les statuts",
          options: Object.entries(accountStatusLabels).map(([value, label]) => ({ value, label })),
          getValue: (a) => a.status,
        },
        {
          id: "agency",
          allLabel: "Toutes les agences",
          options: agencies.map((v) => ({ value: v, label: v })),
          getValue: (a) => a.agency,
        },
      ]}
    />
  )
}
