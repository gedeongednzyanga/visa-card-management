"use client"

import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { statusDistribution } from "@/lib/cards-data"

const chartConfig = {
  value: { label: "Part" },
  active: { label: "Actives", color: "var(--chart-1)" },
  bloquee: { label: "Bloquées", color: "var(--chart-2)" },
  "en-attente": { label: "En attente", color: "var(--chart-3)" },
  expiree: { label: "Expirées", color: "var(--chart-4)" },
} satisfies ChartConfig

const data = statusDistribution.map((item) => ({
  ...item,
  fill: `var(--color-${item.status})`,
}))

export function StatusChart() {
  return (
    <Card className="gap-2 shadow-xs ring-foreground/5">
      <CardHeader>
        <CardTitle className="font-semibold">Répartition par statut</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
        <ChartContainer config={chartConfig} className="aspect-square h-[140px] shrink-0">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey="status" hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="status"
              innerRadius={44}
              outerRadius={64}
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            />
          </PieChart>
        </ChartContainer>
        <ul className="w-full space-y-3 text-[13px]">
          {data.map((item) => (
            <li key={item.status} className="flex items-center gap-3">
              <span
                className="size-3 rounded-sm"
                style={{ backgroundColor: chartConfig[item.status].color }}
              />
              <span className="flex-1 text-muted-foreground">{item.label}</span>
              <span className="font-medium tabular-nums">{item.value}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
