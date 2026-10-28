"use client"

import { useState } from "react"
import { Building2, Mail, MapPin, MoreHorizontal, Phone, User, X } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, type Column } from "@/components/shared/data-table"
import { AccountStatusPill, ActivePill, KycPill } from "@/components/shared/pills"
import { StatusPill } from "@/components/shared/status-pill"
import { accounts, accountTypeLabels, clients, kycLabels, type Client } from "@/lib/data/clients"
import { formatAmount } from "@/lib/format"

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

function ClientPanel({ client, onClose }: { client: Client; onClose: () => void }) {
  const clientAccounts = accounts.filter((a) => a.clientId === client.id)
  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Fiche client</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer">
          <X className="size-5" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback className="bg-sidebar font-semibold text-white">
            {initials(client.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{client.name}</p>
          <p className="text-xs text-muted-foreground">{client.id}</p>
        </div>
      </div>

      <dl className="space-y-2 text-[13px]">
        {[
          { icon: client.type === "entreprise" ? Building2 : User, value: client.type === "entreprise" ? "Entreprise" : "Particulier" },
          { icon: Phone, value: client.phone },
          { icon: Mail, value: client.email },
          { icon: MapPin, value: client.city },
        ].map(({ icon: Icon, value }) => (
          <div key={value} className="flex items-center gap-2.5">
            <Icon className="size-4 text-muted-foreground" />
            <span className="truncate">{value}</span>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2">
        <KycPill value={client.kyc} />
        <ActivePill active={client.active} />
      </div>

      <section className="space-y-2">
        <h3 className="font-semibold">Comptes ({clientAccounts.length})</h3>
        <ul className="divide-y rounded-lg border">
          {clientAccounts.map((a) => (
            <li key={a.number} className="flex items-center justify-between gap-2 px-3 py-2.5 text-[13px]">
              <div>
                <p className="font-medium text-primary">{a.number}</p>
                <p className="text-xs text-muted-foreground">{accountTypeLabels[a.type]}</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="font-medium tabular-nums">{formatAmount(a.balance, a.currency)}</p>
                <AccountStatusPill value={a.status} className="text-[10.5px]" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-2 text-center text-[13px]">
        <div className="rounded-lg border p-3">
          <p className="text-xl font-bold">{client.cards}</p>
          <p className="text-xs text-muted-foreground">Cartes virtuelles</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xl font-bold">{client.createdAt}</p>
          <p className="text-xs text-muted-foreground">Client depuis</p>
        </div>
      </div>
    </div>
  )
}

export function ClientsView({ children }: { children: React.ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = clients.find((c) => c.id === selectedId)

  const columns: Column<Client>[] = [
    { header: "ID client", cell: (c) => <span className="text-primary">{c.id}</span> },
    {
      header: "Client",
      cell: (c) => (
        <span className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px] font-semibold">{initials(c.name)}</AvatarFallback>
          </Avatar>
          <span>
            <span className="block font-medium">{c.name}</span>
            <span className="block text-muted-foreground">{c.email}</span>
          </span>
        </span>
      ),
    },
    {
      header: "Type",
      cell: (c) => (
        <StatusPill tone={c.type === "entreprise" ? "purple" : "info"} className="text-[10.5px]">
          {c.type === "entreprise" ? "Entreprise" : "Particulier"}
        </StatusPill>
      ),
    },
    { header: "Téléphone", cell: (c) => c.phone },
    { header: "Ville", cell: (c) => c.city },
    { header: "Comptes", cell: (c) => c.accounts, className: "text-center" },
    { header: "Cartes", cell: (c) => c.cards, className: "text-center" },
    { header: "KYC", cell: (c) => <KycPill value={c.kyc} className="text-[10.5px]" /> },
    { header: "Inscription", cell: (c) => c.createdAt },
    {
      header: "Actions",
      className: "text-center",
      cell: (c) => (
        <span onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="icon-sm" className="h-6 w-8" aria-label={`Actions pour ${c.name}`} />}
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setSelectedId(c.id)}>Voir la fiche</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info(`Modification de ${c.name}`)}>Modifier</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => toast.warning(`${c.name} désactivé`)}>
                Désactiver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-1 flex-col xl:flex-row">
      <main className="min-w-0 flex-1 space-y-4 p-4 sm:p-6">
        {children}
        <DataTable
          title="Liste des clients"
          data={clients}
          columns={columns}
          rowKey={(c) => c.id}
          itemLabel="clients"
          searchPlaceholder="Rechercher par nom, ID, téléphone, e-mail..."
          searchText={(c) => `${c.name} ${c.id} ${c.phone} ${c.email}`}
          filters={[
            {
              id: "type",
              allLabel: "Tous les types",
              options: [
                { value: "particulier", label: "Particuliers" },
                { value: "entreprise", label: "Entreprises" },
              ],
              getValue: (c) => c.type,
            },
            {
              id: "kyc",
              allLabel: "Tous les KYC",
              options: Object.entries(kycLabels).map(([value, label]) => ({ value, label })),
              getValue: (c) => c.kyc,
            },
            {
              id: "city",
              allLabel: "Toutes les villes",
              options: [...new Set(clients.map((c) => c.city))].sort().map((v) => ({ value: v, label: v })),
              getValue: (c) => c.city,
            },
          ]}
          onRowClick={(c) => setSelectedId(c.id)}
          isRowSelected={(c) => c.id === selectedId}
        />
      </main>

      {selected && (
        <aside className="shrink-0 border-t bg-card xl:sticky xl:top-[52px] xl:h-[calc(100svh-52px)] xl:w-[350px] xl:overflow-y-auto xl:border-t-0 xl:border-l">
          <ClientPanel client={selected} onClose={() => setSelectedId(null)} />
        </aside>
      )}
    </div>
  )
}
