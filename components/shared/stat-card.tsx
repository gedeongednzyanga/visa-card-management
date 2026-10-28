import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toneStyles, type Tone } from "./status-pill"

export type StatCardProps = {
  label: string
  value: string
  icon: LucideIcon
  tone: Tone
  trend?: React.ReactNode
  caption?: string
}

export function StatCard({ label, value, icon: Icon, tone, trend, caption }: StatCardProps) {
  return (
    <Card className="flex-row items-start gap-4 px-4 py-4 shadow-xs ring-foreground/5">
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl",
          toneStyles[tone].soft
        )}
      >
        <Icon className="size-6" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-[13px] text-foreground/80">{label}</p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {trend && (
            <span className={cn("text-xs font-medium", toneStyles[tone].text)}>{trend}</span>
          )}
        </div>
        {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
      </div>
    </Card>
  )
}

export function StatGrid({ stats }: { stats: StatCardProps[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
