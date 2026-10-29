"use client"

import { useState } from "react"
import { Bell, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { AppSidebar } from "./app-sidebar"

export function DashboardShell({
  children,
  userMenu,
}: {
  children: React.ReactNode
  userMenu: React.ReactNode
}) {
  // Sur desktop : sidebar repliable ; sur mobile : tiroir superposé.
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setDesktopOpen((v) => !v)
    } else {
      setMobileOpen((v) => !v)
    }
  }

  return (
    <div className="flex min-h-svh">
      <div
        className={cn(
          "sticky top-0 hidden h-svh w-56.5 shrink-0 lg:block",
          !desktopOpen && "lg:hidden"
        )}
      >
        <AppSidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-65">
            <AppSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-13 shrink-0 items-center gap-3 border-b bg-card px-4 sm:gap-5 sm:px-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Afficher ou masquer le menu"
          >
            <Menu className="size-5" />
          </Button>

          <div className="relative w-full max-w-105">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un client, une carte, un numéro de carte..."
              className="h-9 bg-muted/40 pl-9 text-[13px]"
            />
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-6">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications (3 non lues)"
            >
              <Bell className="size-5" />
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
                3
              </span>
            </Button>

            {userMenu}
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
