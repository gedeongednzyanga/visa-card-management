"use client"

import Link from "next/link"
import { useState } from "react"
import { Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { virtualCards } from "@/lib/cards-data"
import { cn } from "@/lib/utils"
import { CardDetails } from "./card-details"
import { CardsTable } from "./cards-table"
import { EmissionsChart } from "./emissions-chart"
import { StatCards } from "./stat-cards"
import { StatusChart } from "./status-chart"

export function VirtualCardsView() {
  const [selectedRef, setSelectedRef] = useState<string | null>(
    virtualCards[0].reference
  )
  const selected = virtualCards.find((card) => card.reference === selectedRef)

  return (
    <div className="flex flex-1 flex-col xl:flex-row">
      <main className="min-w-0 flex-1 space-y-4 p-4 sm:p-6">
        <PageHeader
          title="Cartes virtuelles"
          breadcrumb={[
            { label: "Cartes virtuelles", href: "/cartes-virtuelles" },
            { label: "Toutes les cartes" },
          ]}
          actions={
            <Link
              href="/cartes-virtuelles/emission"
              className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
            >
              <Plus />
              Émettre une carte virtuelle
            </Link>
          }
        />

        <StatCards />

        <div className="grid gap-4 2xl:grid-cols-[1.3fr_1fr]">
          <EmissionsChart />
          <StatusChart />
        </div>

        <CardsTable
          cards={virtualCards}
          selectedRef={selectedRef}
          onSelect={setSelectedRef}
        />
      </main>

      {selected && (
        <aside className="shrink-0 border-t bg-card xl:sticky xl:top-[52px] xl:h-[calc(100svh-52px)] xl:w-[350px] xl:overflow-y-auto xl:border-t-0 xl:border-l">
          <CardDetails card={selected} onClose={() => setSelectedRef(null)} />
        </aside>
      )}
    </div>
  )
}
