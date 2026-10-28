"use client"

import { useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Lock,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Unlock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  cardStats,
  networkLabels,
  statusLabels,
  type VirtualCard,
} from "@/lib/cards-data"
import { cn } from "@/lib/utils"
import { NetworkLogo, StatusBadge } from "./card-badges"

const statusItems = [
  { value: "all", label: "Tous les statuts" },
  ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
]
const typeItems = [
  { value: "all", label: "Tous les types" },
  ...Object.entries(networkLabels).map(([value, label]) => ({ value, label })),
]
const currencyItems = [
  { value: "all", label: "Toutes les devises" },
  { value: "USD", label: "USD" },
  { value: "CDF", label: "CDF" },
]

const PAGE_COUNT = 125

function FilterSelect({
  items,
  value,
  onChange,
}: {
  items: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(v) => onChange(v ?? "all")}
    >
      <SelectTrigger className="h-9 text-[11px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CardsTable({
  cards,
  selectedRef,
  onSelect,
}: {
  cards: VirtualCard[]
  selectedRef: string | null
  onSelect: (reference: string) => void
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [type, setType] = useState("all")
  const [currency, setCurrency] = useState("all")
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter(
      (card) =>
        (status === "all" || card.status === status) &&
        (type === "all" || card.network === type) &&
        (currency === "all" || card.currency === currency) &&
        (!q ||
          card.holder.toLowerCase().includes(q) ||
          card.reference.toLowerCase().includes(q) ||
          card.account.includes(q) ||
          card.last4.includes(q))
    )
  }, [cards, query, status, type, currency])

  const isFiltered =
    query.trim() !== "" || status !== "all" || type !== "all" || currency !== "all"
  const allChecked =
    filtered.length > 0 && filtered.every((card) => checked.has(card.reference))

  function toggleAll(value: boolean) {
    setChecked(value ? new Set(filtered.map((c) => c.reference)) : new Set())
  }

  function toggleOne(reference: string, value: boolean) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (value) next.add(reference)
      else next.delete(reference)
      return next
    })
  }

  return (
    <Card className="gap-3 shadow-xs ring-foreground/5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Liste des cartes</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[110px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par client, numéro, référence..."
              className="h-9 pl-8 text-[11px]"
            />
          </div>
          <FilterSelect items={statusItems} value={status} onChange={setStatus} />
          <FilterSelect items={typeItems} value={type} onChange={setType} />
          <FilterSelect items={currencyItems} value={currency} onChange={setCurrency} />
          <Button variant="outline" className="h-9 text-[11px] font-normal">
            <CalendarDays />
            Du 01/10/2026 au 20/10/2026
          </Button>
          <Button className="h-9 px-4 text-xs">
            Filtrer
          </Button>
          <Button variant="outline" className="h-9 text-[11px]">
            <Download />
            Exporter
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table className="text-[11px] [&_td]:py-1.5 [&_th]:h-9 [&_th]:text-[11px] [&_th]:font-semibold">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-3">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={toggleAll}
                    aria-label="Tout sélectionner"
                  />
                </TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Numéro de carte</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date d&apos;émission</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead className="pr-3 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((card) => (
                <TableRow
                  key={card.reference}
                  data-state={selectedRef === card.reference ? "selected" : undefined}
                  onClick={() => onSelect(card.reference)}
                  className="cursor-pointer data-[state=selected]:bg-primary/5"
                >
                  <TableCell className="pl-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={checked.has(card.reference)}
                      onCheckedChange={(v) => toggleOne(card.reference, v)}
                      aria-label={`Sélectionner ${card.reference}`}
                    />
                  </TableCell>
                  <TableCell className="text-primary">{card.reference}</TableCell>
                  <TableCell>
                    <div className="font-medium">{card.holder}</div>
                    <div className="text-muted-foreground">{card.account}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    **** **** **** {card.last4}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span className="flex w-6 justify-center">
                        <NetworkLogo network={card.network} />
                      </span>
                      {networkLabels[card.network]}
                    </span>
                  </TableCell>
                  <TableCell>{card.currency}</TableCell>
                  <TableCell>
                    <StatusBadge status={card.status} className="text-[10.5px]" />
                  </TableCell>
                  <TableCell>{card.issuedAt}</TableCell>
                  <TableCell>{card.expiresAt}</TableCell>
                  <TableCell className="pr-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="h-6 w-8"
                            aria-label={`Actions pour ${card.reference}`}
                          />
                        }
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => onSelect(card.reference)}>
                          <Eye /> Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <SlidersHorizontal /> Modifier les limites
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {card.status === "bloquee" ? (
                          <DropdownMenuItem>
                            <Unlock /> Débloquer
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem variant="destructive">
                            <Lock /> Bloquer la carte
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    Aucune carte ne correspond à vos critères.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            {isFiltered
              ? `${filtered.length} carte(s) trouvée(s)`
              : `Affichage de ${(page - 1) * 10 + 1} à ${page * 10} sur ${new Intl.NumberFormat("en-US").format(cardStats.total)} cartes`}
          </p>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1" aria-label="Pagination">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  size="icon-sm"
                  variant={page === n ? "default" : "outline"}
                  onClick={() => setPage(n)}
                  aria-current={page === n ? "page" : undefined}
                  className={cn("text-xs", page !== n && "border-transparent")}
                >
                  {n}
                </Button>
              ))}
              <span className="px-1 text-xs text-muted-foreground">…</span>
              <Button
                size="sm"
                variant={page === PAGE_COUNT ? "default" : "outline"}
                className={cn("text-xs", page !== PAGE_COUNT && "border-transparent")}
                onClick={() => setPage(PAGE_COUNT)}
              >
                {PAGE_COUNT}
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Page précédente"
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(PAGE_COUNT, p + 1))}
                disabled={page === PAGE_COUNT}
                aria-label="Page suivante"
              >
                <ChevronRight />
              </Button>
            </nav>
            <Select items={[10, 25, 50].map((n) => ({ value: n, label: String(n) }))} defaultValue={10}>
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
