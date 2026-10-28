import { ArrowUp, Check, Clock, CreditCard, Lock, RefreshCw, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cardStats } from "@/lib/cards-data"
import { cn } from "@/lib/utils"

const nf = new Intl.NumberFormat("en-US")

type Stat = {
  label: string
  value: number
  icon: typeof Lock
  iconClass: string
  trend: React.ReactNode
  caption: string
}

const stats: Stat[] = [
  {
    label: "Total des cartes",
    value: cardStats.total,
    icon: CreditCard,
    iconClass: "bg-blue-50 text-primary",
    trend: (
      <span className="inline-flex items-center gap-0.5 text-emerald-600">
        <ArrowUp className="size-3.5" />+{cardStats.totalGrowth}%
      </span>
    ),
    caption: "Toutes les cartes émises",
  },
  {
    label: "Cartes actives",
    value: cardStats.active,
    icon: Check,
    iconClass: "bg-emerald-50 text-emerald-600 [&>svg]:rounded-full [&>svg]:bg-emerald-600 [&>svg]:p-1 [&>svg]:text-white",
    trend: (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <RefreshCw className="size-3" />
        {cardStats.activeRate}%
      </span>
    ),
    caption: "En service",
  },
  {
    label: "Cartes bloquées",
    value: cardStats.blocked,
    icon: Lock,
    iconClass: "bg-red-50 text-red-600",
    trend: (
      <span className="inline-flex items-center gap-1 text-red-600">
        <TrendingUp className="size-3" />
        {cardStats.blockedRate}%
      </span>
    ),
    caption: "Temporairement bloquées",
  },
  {
    label: "En attente",
    value: cardStats.pending,
    icon: Clock,
    iconClass: "bg-orange-50 text-orange-500",
    trend: (
      <span className="inline-flex items-center gap-1 text-orange-500">
        <RefreshCw className="size-3" />
        {cardStats.pendingRate}%
      </span>
    ),
    caption: "En cours d'émission",
  },
]

export function StatCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="flex-row items-start gap-4 px-4 py-4 shadow-xs ring-foreground/5">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl",
                stat.iconClass
              )}
            >
              <Icon className="size-7" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[13px] text-foreground/80">{stat.label}</p>
              <div
                className={cn(
                  "flex gap-x-3",
                  i === 0 ? "items-center" : "flex-col gap-y-1"
                )}
              >
                <span className="text-2xl font-bold tracking-tight">
                  {nf.format(stat.value)}
                </span>
                <span className="text-xs font-medium">{stat.trend}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.caption}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
