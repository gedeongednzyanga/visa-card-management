"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BarChart3,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  Landmark,
  Receipt,
  Settings,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  icon: LucideIcon
  href?: string
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: "Tableau de bord", icon: LayoutDashboard, href: "/tableau-de-bord" },
  { label: "Clients", icon: Users, href: "/clients" },
  {
    label: "Comptes",
    icon: Landmark,
    children: [
      { label: "Tous les comptes", href: "/comptes" },
      { label: "Ouverture de compte", href: "/comptes/ouverture" },
    ],
  },
  {
    label: "Cartes virtuelles",
    icon: CreditCard,
    children: [
      { label: "Toutes les cartes", href: "/cartes-virtuelles" },
      { label: "Demande de carte", href: "/cartes-virtuelles/demandes" },
      { label: "Émission de carte", href: "/cartes-virtuelles/emission" },
      { label: "Limites et plafonds", href: "/cartes-virtuelles/limites" },
      { label: "Blocage / Déblocage", href: "/cartes-virtuelles/blocage" },
      { label: "Transactions cartes", href: "/cartes-virtuelles/transactions" },
      { label: "Paramètres cartes", href: "/cartes-virtuelles/parametres" },
    ],
  },
  {
    label: "Transactions",
    icon: Receipt,
    children: [{ label: "Toutes les transactions", href: "/transactions" }],
  },
  {
    label: "Gestion des risques",
    icon: ShieldAlert,
    children: [{ label: "Alertes de fraude", href: "/risques" }],
  },
  {
    label: "Rapports",
    icon: BarChart3,
    children: [{ label: "Rapports générés", href: "/rapports" }],
  },
  {
    label: "Paramètres système",
    icon: Settings,
    children: [{ label: "Utilisateurs et rôles", href: "/parametres" }],
  },
]

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  // Choix explicite de l'utilisateur ; à défaut, le groupe de la page en cours est ouvert.
  const [open, setOpen] = useState<Record<string, boolean>>({})

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-[52px] shrink-0 items-center px-4">
        <BrandLogo preload />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === pathname ||
            !!item.children?.some((child) => child.href === pathname)
          const itemClass = cn(
            "flex h-10 w-full items-center gap-3 rounded-md px-3 text-[13.5px] font-medium whitespace-nowrap transition-colors hover:bg-sidebar-accent",
            isActive && "bg-sidebar-primary hover:bg-sidebar-primary"
          )

          if (!item.children) {
            return (
              <Link
                key={item.label}
                href={item.href!}
                onClick={onNavigate}
                className={itemClass}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            )
          }

          const expanded = open[item.label] ?? isActive
          return (
            <div key={item.label}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() =>
                  setOpen((prev) => ({ ...prev, [item.label]: !expanded }))
                }
                className={itemClass}
              >
                <Icon className="size-5" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    expanded && "rotate-180"
                  )}
                />
              </button>
              {expanded && (
                <ul className="mt-2 mb-3 space-y-1">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={child.href === pathname ? "page" : undefined}
                        className={cn(
                          "flex h-8 items-center rounded-md pl-12 text-[12.5px] whitespace-nowrap text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent",
                          child.href === pathname &&
                            "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
