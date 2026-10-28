"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { AppSidebar } from "./app-sidebar"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  // Sur desktop : sidebar repliable ; sur mobile : tiroir superposé.
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

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
          "sticky top-0 hidden h-svh w-[226px] shrink-0 lg:block",
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
          <div className="relative h-full w-[260px]">
            <AppSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-[52px] shrink-0 items-center gap-3 border-b bg-card px-4 sm:gap-5 sm:px-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Afficher ou masquer le menu"
          >
            <Menu className="size-5" />
          </Button>

          <div className="relative w-full max-w-[420px]">
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

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-lg p-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                }
              >
                <Avatar className="size-10">
                  <AvatarFallback className="bg-sidebar text-sm font-semibold text-white">
                    DB
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-semibold">
                    Daniel Balinda
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Administrateur
                  </span>
                </span>
                <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User /> Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/parametres")}>
                  <Settings /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => router.push("/connexion")}>
                  <LogOut /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
