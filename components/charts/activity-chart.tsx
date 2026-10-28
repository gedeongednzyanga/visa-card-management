"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type Series = { key: string; label: string; color: string }

export function ActivityChart({
  title,
  subtitle,
  data,
  xKey,
  series,
  variant = "area",
  height = 220,
  action,
}: {
  title: string
  subtitle?: string
  data: Record<string, string | number>[]
  xKey: string
  series: Series[]
  variant?: "area" | "bar"
  height?: number
  action?: React.ReactNode
}) {
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) satisfies ChartConfig

  return (
    <Card className="gap-2 shadow-xs ring-foreground/5">
      <CardHeader>
        <CardTitle className="font-semibold">
          {title}{" "}
          {subtitle && (
            <span className="text-sm font-normal text-muted-foreground">{subtitle}</span>
          )}
        </CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
          {variant === "area" ? (
            <AreaChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${s.key})`} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={`var(--color-${s.key})`} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              {series.map((s) => (
                <Area
                  key={s.key}
                  dataKey={s.key}
                  type="monotone"
                  stroke={`var(--color-${s.key})`}
                  strokeWidth={2}
                  fill={`url(#fill-${s.key})`}
                />
              ))}
              {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={48} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={[4, 4, 0, 0]} maxBarSize={28} />
              ))}
              {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
