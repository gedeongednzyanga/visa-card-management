"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"

export type Column<T> = {
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

export type Filter<T> = {
  id: string
  allLabel: string
  options: { value: string; label: string }[]
  getValue: (row: T) => string
}

const PAGE_SIZES = [10, 25, 50]

export function FilterSelect({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <Select items={items} value={value} onValueChange={(v) => onChange(v ?? "all")}>
      <SelectTrigger className={cn("h-9 text-[11px]", className)}>
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

/** Pages affichées : 1 … p-1 p p+1 … n */
function visiblePages(page: number, count: number) {
  const pages = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count))
  return [...pages].sort((a, b) => a - b)
}

export function DataTable<T>({
  title,
  data,
  columns,
  rowKey,
  searchPlaceholder = "Rechercher...",
  searchText,
  filters = [],
  toolbar,
  headerAction,
  exportable = true,
  emptyMessage = "Aucun résultat ne correspond à vos critères.",
  onRowClick,
  isRowSelected,
  itemLabel = "éléments",
}: {
  title?: string
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  searchPlaceholder?: string
  /** Texte dans lequel la recherche s'effectue. Sans cette prop, pas de champ de recherche. */
  searchText?: (row: T) => string
  filters?: Filter<T>[]
  toolbar?: React.ReactNode
  headerAction?: React.ReactNode
  exportable?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  isRowSelected?: (row: T) => boolean
  itemLabel?: string
}) {
  const [query, setQuery] = useState("")
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.filter(
      (row) =>
        (!q || !searchText || searchText(row).toLowerCase().includes(q)) &&
        filters.every((f) => {
          const v = filterValues[f.id] ?? "all"
          return v === "all" || f.getValue(row) === v
        })
    )
  }, [data, query, searchText, filters, filterValues])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize)
  const from = filtered.length === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, filtered.length)

  const pages = visiblePages(current, pageCount)

  return (
    <Card className="gap-3 shadow-xs ring-foreground/5">
      {title && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {headerAction && <CardAction>{headerAction}</CardAction>}
        </CardHeader>
      )}

      <CardContent className="space-y-3">
        {(searchText || filters.length > 0 || toolbar || exportable) && (
          <div className="flex flex-wrap items-center gap-2">
            {searchText && (
              <div className="relative min-w-[160px] flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(1)
                  }}
                  placeholder={searchPlaceholder}
                  className="h-9 pl-8 text-[11px]"
                />
              </div>
            )}
            {filters.map((f) => (
              <FilterSelect
                key={f.id}
                items={[{ value: "all", label: f.allLabel }, ...f.options]}
                value={filterValues[f.id] ?? "all"}
                onChange={(v) => {
                  setFilterValues((prev) => ({ ...prev, [f.id]: v }))
                  setPage(1)
                }}
              />
            ))}
            {toolbar}
            {exportable && (
              <Button
                variant="outline"
                className="ml-auto h-9 text-[11px]"
                onClick={() => toast.success(`Export de ${filtered.length} ${itemLabel} lancé`)}
              >
                <Download />
                Exporter
              </Button>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border">
          <Table className="text-[11px] [&_td]:py-2 [&_th]:h-9 [&_th]:text-[11px] [&_th]:font-semibold">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead key={col.header} className={cn("first:pl-3 last:pr-3", col.className)}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  data-state={isRowSelected?.(row) ? "selected" : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "data-[state=selected]:bg-primary/5",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <TableCell key={col.header} className={cn("first:pl-3 last:pr-3", col.className)}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Affichage de {from} à {to} sur {filtered.length} {itemLabel}
          </p>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1" aria-label="Pagination">
              {pages.map((n, i) => (
                <span key={n} className="flex items-center gap-1">
                  {i > 0 && n - pages[i - 1] > 1 && (
                    <span className="px-1 text-xs text-muted-foreground">…</span>
                  )}
                  <Button
                    size="icon-sm"
                    variant={current === n ? "default" : "outline"}
                    onClick={() => setPage(n)}
                    aria-current={current === n ? "page" : undefined}
                    className={cn("text-xs", current !== n && "border-transparent")}
                  >
                    {n}
                  </Button>
                </span>
              ))}
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => setPage(current - 1)}
                disabled={current === 1}
                aria-label="Page précédente"
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => setPage(current + 1)}
                disabled={current === pageCount}
                aria-label="Page suivante"
              >
                <ChevronRight />
              </Button>
            </nav>
            <Select
              items={PAGE_SIZES.map((n) => ({ value: n, label: String(n) }))}
              value={pageSize}
              onValueChange={(v) => {
                if (v) setPageSize(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
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
