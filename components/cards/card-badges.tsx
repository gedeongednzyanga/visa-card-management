import { CheckCircle2, Clock, Lock, MinusSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { statusLabels, type CardNetwork, type CardStatus } from "@/lib/cards-data"
import { cn } from "@/lib/utils"

const statusStyles: Record<CardStatus, { className: string; icon: typeof Lock }> = {
  active: { className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  bloquee: { className: "bg-red-50 text-red-600", icon: Lock },
  "en-attente": { className: "bg-orange-50 text-orange-600", icon: Clock },
  expiree: { className: "bg-slate-100 text-slate-600", icon: MinusSquare },
}

export function StatusBadge({
  status,
  className,
}: {
  status: CardStatus
  className?: string
}) {
  const { className: styles, icon: Icon } = statusStyles[status]
  return (
    <Badge
      className={cn("rounded-md px-2 font-medium", styles, className)}
    >
      <Icon data-icon="inline-start" />
      {statusLabels[status]}
    </Badge>
  )
}

export function NetworkLogo({
  network,
  className,
}: {
  network: CardNetwork
  className?: string
}) {
  if (network === "visa") {
    return (
      <span
        aria-label="Visa"
        className={cn(
          "inline-block text-[13px] font-black tracking-tight text-[#1a1f71] italic",
          className
        )}
      >
        VISA
      </span>
    )
  }
  return (
    <span
      aria-label="Mastercard"
      className={cn("relative inline-flex h-4 w-6 items-center", className)}
    >
      <span className="absolute left-0 size-4 rounded-full bg-[#eb001b]" />
      <span className="absolute right-0 size-4 rounded-full bg-[#f79e1b] mix-blend-multiply" />
    </span>
  )
}
