import Image from "next/image"
import { logoIconWhite } from "@/components/brand-logo"
import type { VirtualCard } from "@/lib/cards-data"
import { cn } from "@/lib/utils"

export function VirtualCardVisual({
  card,
  className,
}: {
  card: VirtualCard
  className?: string
}) {
  const [, month, year] = card.expiresAt.split("/")

  return (
    <div
      className={cn(
        "relative aspect-[1.6] w-full overflow-hidden rounded-xl bg-[linear-gradient(135deg,#0d2f6e_0%,#14408f_55%,#0b2a5b_100%)] p-5 text-white shadow-lg",
        className
      )}
    >
      {/* Motif décoratif */}
      <div className="pointer-events-none absolute -right-16 -bottom-24 size-72 rounded-full border-[40px] border-white/5" />
      <div className="pointer-events-none absolute top-6 -right-10 size-40 rounded-full bg-white/5" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 font-serif text-sm font-semibold">
            <Image src={logoIconWhite} alt="" className="size-6" />
            Accès Finance
          </div>
          {card.network === "visa" ? (
            <span className="text-3xl leading-none font-black tracking-tight italic">
              VISA
            </span>
          ) : (
            <span className="relative inline-flex h-8 w-12" aria-label="Mastercard">
              <span className="absolute left-0 size-8 rounded-full bg-[#eb001b]" />
              <span className="absolute right-0 size-8 rounded-full bg-[#f79e1b]/90" />
            </span>
          )}
        </div>

        <div className="mt-4 h-7 w-9 shrink-0 rounded-md bg-[linear-gradient(135deg,#f5d77a,#c9a646)] ring-1 ring-black/10" />

        <div className="mt-3 font-mono text-[15px] tracking-[0.18em]">
          **** **** **** {card.last4}
        </div>

        <div className="mt-2 flex items-center gap-3 font-mono">
          <span className="text-[8px] leading-tight uppercase">
            Valid
            <br />
            Thru
          </span>
          <span className="text-sm">
            {month}/{year.slice(-2)}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <span className="font-mono text-sm tracking-widest uppercase">
            {card.holder}
          </span>
          <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-[9px] tracking-wider">
            VIRTUAL
          </span>
        </div>
      </div>
    </div>
  )
}
