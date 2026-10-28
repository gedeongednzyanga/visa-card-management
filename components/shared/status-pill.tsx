import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type Tone = "success" | "danger" | "warning" | "neutral" | "info" | "purple"

export const toneStyles: Record<Tone, { pill: string; soft: string; text: string }> = {
  success: { pill: "bg-emerald-50 text-emerald-700", soft: "bg-emerald-50 text-emerald-600", text: "text-emerald-600" },
  danger: { pill: "bg-red-50 text-red-600", soft: "bg-red-50 text-red-600", text: "text-red-600" },
  warning: { pill: "bg-orange-50 text-orange-600", soft: "bg-orange-50 text-orange-500", text: "text-orange-500" },
  neutral: { pill: "bg-slate-100 text-slate-600", soft: "bg-slate-100 text-slate-600", text: "text-slate-600" },
  info: { pill: "bg-blue-50 text-primary", soft: "bg-blue-50 text-primary", text: "text-primary" },
  purple: { pill: "bg-purple-50 text-purple-600", soft: "bg-purple-50 text-purple-600", text: "text-purple-600" },
}

export function StatusPill({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: Tone
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <Badge className={cn("rounded-md px-2 font-medium", toneStyles[tone].pill, className)}>
      {Icon && <Icon data-icon="inline-start" />}
      {children}
    </Badge>
  )
}
