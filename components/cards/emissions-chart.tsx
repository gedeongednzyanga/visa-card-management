"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { emissionsData } from "@/lib/cards-data"

const chartConfig = {
  count: { label: "Cartes émises", color: "var(--chart-1)" },
} satisfies ChartConfig

export function EmissionsChart() {
  return (
    <Card className="gap-2 shadow-xs ring-foreground/5">
      <CardHeader>
        <CardTitle className="font-semibold">
          Émissions de cartes{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (30 derniers jours)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[150px] w-full">
          <BarChart data={emissionsData} margin={{ left: -24, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={4}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              ticks={[0, 10, 20, 30, 40]}
              domain={[0, 40]}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} maxBarSize={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
