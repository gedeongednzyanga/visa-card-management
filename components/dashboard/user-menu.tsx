"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, LogOut, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/actions/auth"
import type { CurrentUser } from "@/lib/auth"

const roleLabels: Record<CurrentUser["role"], string> = {
  admin: "Administrateur",
  user: "Utilisateur",
}

export function UserMenu({ user }: { user: CurrentUser }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()

  return (
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
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">
            {user.firstName} {user.lastName}
          </span>
          <span className="block text-xs text-muted-foreground">
            {roleLabels[user.role]}
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
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onClick={() => startTransition(() => logout())}
        >
          <LogOut /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-3 p-1">
      <div className="size-10 animate-pulse rounded-full bg-muted" />
      <div className="hidden space-y-1.5 sm:block">
        <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
