"use client"

import { useState } from "react"
import { Download, FileBarChart, FileSpreadsheet, FileText, Play } from "lucide-react"
import { toast } from "sonner"
import { ActivityChart } from "@/components/charts/activity-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, FilterSelect, type Column } from "@/components/shared/data-table"
import { FormField } from "@/components/shared/form-field"
import { StatusPill } from "@/components/shared/status-pill"
import { monthlyActivity, reports, type Report } from "@/lib/data/operations"

const categories = ["Cartes", "Transactions", "Clients", "Risques", "Comptabilité"] as const

const formatIcon = { PDF: FileText, XLSX: FileSpreadsheet, CSV: FileBarChart }

const columns: Column<Report>[] = [
  {
    header: "Rapport",
    cell: (r) => {
      const Icon = formatIcon[r.format]
      return (
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
            <Icon className="size-4" />
          </span>
          <span>
            <span className="block font-medium">{r.name}</span>
            <span className="block text-muted-foreground">{r.id}</span>
          </span>
        </span>
      )
    },
  },
  { header: "Catégorie", cell: (r) => <StatusPill tone="info" className="text-[10.5px]">{r.category}</StatusPill> },
  { header: "Période", cell: (r) => r.period },
  { header: "Généré le", cell: (r) => r.generatedAt },
  { header: "Format", cell: (r) => `${r.format} · ${r.size}` },
  {
    header: "Télécharger",
    className: "text-center",
    cell: (r) => (
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={`Télécharger ${r.name}`}
        onClick={() => toast.success(`Téléchargement de ${r.id}.${r.format.toLowerCase()}`)}
      >
        <Download />
      </Button>
    ),
  },
]

export function ReportsView() {
  const [category, setCategory] = useState<string>("Cartes")
  const [period, setPeriod] = useState("2026-10")
  const [format, setFormat] = useState("PDF")

  return (
    <>
      <div className="grid gap-4 2xl:grid-cols-[1.4fr_1fr]">
        <ActivityChart
          title="Cartes émises par mois"
          subtitle="(6 derniers mois)"
          variant="bar"
          data={monthlyActivity}
          xKey="month"
          series={[{ key: "cartes", label: "Cartes émises", color: "var(--chart-1)" }]}
        />

        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Générer un rapport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Catégorie">
              <FilterSelect
                items={categories.map((c) => ({ value: c, label: c }))}
                value={category}
                onChange={setCategory}
                className="w-full text-sm"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Période">
                <FilterSelect
                  items={[
                    { value: "2026-10", label: "Octobre 2026" },
                    { value: "2026-09", label: "Septembre 2026" },
                    { value: "2026-T3", label: "T3 2026" },
                    { value: "2026", label: "Année 2026" },
                  ]}
                  value={period}
                  onChange={setPeriod}
                  className="w-full text-sm"
                />
              </FormField>
              <FormField label="Format">
                <FilterSelect
                  items={["PDF", "XLSX", "CSV"].map((f) => ({ value: f, label: f }))}
                  value={format}
                  onChange={setFormat}
                  className="w-full text-sm"
                />
              </FormField>
            </div>
            <Button
              className="h-10 w-full"
              onClick={() =>
                toast.success(`Rapport « ${category} » en cours de génération`, {
                  description: `Format ${format}. Il apparaîtra dans la liste dans quelques minutes.`,
                })
              }
            >
              <Play /> Générer
            </Button>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="Rapports générés"
        data={reports}
        columns={columns}
        rowKey={(r) => r.id}
        itemLabel="rapports"
        exportable={false}
        searchPlaceholder="Rechercher un rapport..."
        searchText={(r) => `${r.name} ${r.id} ${r.period}`}
        filters={[
          {
            id: "category",
            allLabel: "Toutes les catégories",
            options: categories.map((c) => ({ value: c, label: c })),
            getValue: (r) => r.category,
          },
          {
            id: "format",
            allLabel: "Tous les formats",
            options: ["PDF", "XLSX", "CSV"].map((f) => ({ value: f, label: f })),
            getValue: (r) => r.format,
          },
        ]}
      />
    </>
  )
}
