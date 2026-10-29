"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2, MoreHorizontal, Plus, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, FilterSelect, type Column } from "@/components/shared/data-table"
import { FormField } from "@/components/shared/form-field"
import { ActivePill } from "@/components/shared/pills"
import { StatusPill } from "@/components/shared/status-pill"
import { createUser } from "@/lib/actions/users"
import type { ApiUser } from "@/lib/api"
import { rolePermissions } from "@/lib/data/operations"

const roleLabels: Record<ApiUser["role"], string> = {
  admin: "Administrateur",
  user: "Utilisateur",
}

const fullName = (u: ApiUser) => `${u.firstName} ${u.lastName}`
const initials = (u: ApiUser) => `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase()
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" })

// Mêmes règles que le RegisterDto de l'API acces-register.
const PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}"

function NewUserDialog({ onCreate }: { onCreate: (user: ApiUser) => void }) {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setError(null)
      setShowPassword(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError(null)
    setLoading(true)
    const result = await createUser({
      firstName: String(form.get("firstName")),
      lastName: String(form.get("lastName")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }

    onCreate(result.user)
    toast.success(`Utilisateur ${fullName(result.user)} créé`)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button className="h-9" />}>
        <Plus /> Ajouter un utilisateur
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prénom" htmlFor="u-first-name">
              <Input id="u-first-name" name="firstName" required maxLength={100} autoComplete="off" />
            </FormField>
            <FormField label="Nom" htmlFor="u-last-name">
              <Input id="u-last-name" name="lastName" required maxLength={100} autoComplete="off" />
            </FormField>
          </div>
          <FormField label="E-mail professionnel" htmlFor="u-email">
            <Input
              id="u-email"
              name="email"
              type="email"
              required
              maxLength={180}
              autoComplete="off"
              placeholder="prenom@accesfinance.cd"
            />
          </FormField>
          <FormField
            label="Mot de passe initial"
            htmlFor="u-password"
            hint="8 caractères minimum, avec une majuscule, une minuscule et un chiffre."
          >
            <div className="relative">
              <Input
                id="u-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                pattern={PASSWORD_PATTERN}
                title="8 caractères minimum, avec une majuscule, une minuscule et un chiffre"
                autoComplete="new-password"
                className="pr-9"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </FormField>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Annuler</DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Créer l&apos;utilisateur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SystemSettingsView({ initialUsers }: { initialUsers: ApiUser[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [twoFactor, setTwoFactor] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState("15")

  function toggleActive(user: ApiUser) {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)))
    toast.success(`${fullName(user)} ${user.isActive ? "désactivé" : "réactivé"}`)
  }

  const columns: Column<ApiUser>[] = [
    {
      header: "Utilisateur",
      cell: (u) => (
        <span className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px] font-semibold">{initials(u)}</AvatarFallback>
          </Avatar>
          <span>
            <span className="block font-medium">{fullName(u)}</span>
            <span className="block text-muted-foreground">{u.email}</span>
          </span>
        </span>
      ),
    },
    {
      header: "Rôle",
      cell: (u) => (
        <StatusPill tone={u.role === "admin" ? "purple" : "info"} className="text-[10.5px]">
          {roleLabels[u.role]}
        </StatusPill>
      ),
    },
    { header: "Créé le", cell: (u) => dateFormat.format(new Date(u.createdAt)) },
    { header: "Statut", cell: (u) => <ActivePill active={u.isActive} /> },
    {
      header: "Actions",
      className: "text-center",
      cell: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="icon-sm" className="h-6 w-8" aria-label={`Actions pour ${fullName(u)}`} />}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => toast.info(`Lien de réinitialisation envoyé à ${u.email}`)}>
              Réinitialiser le mot de passe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant={u.isActive ? "destructive" : "default"} onClick={() => toggleActive(u)}>
              {u.isActive ? "Désactiver" : "Réactiver"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <Tabs defaultValue="users" className="gap-4">
      <TabsList className="bg-foreground/5">
        <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        <TabsTrigger value="roles">Rôles et permissions</TabsTrigger>
        <TabsTrigger value="security">Sécurité</TabsTrigger>
        <TabsTrigger value="institution">Établissement</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <DataTable
          title="Utilisateurs"
          headerAction={<NewUserDialog onCreate={(u) => setUsers((prev) => [u, ...prev])} />}
          data={users}
          columns={columns}
          rowKey={(u) => String(u.id)}
          itemLabel="utilisateurs"
          exportable={false}
          searchPlaceholder="Rechercher par nom, e-mail..."
          searchText={(u) => `${fullName(u)} ${u.email}`}
          filters={[
            {
              id: "role",
              allLabel: "Tous les rôles",
              options: Object.entries(roleLabels).map(([value, label]) => ({ value, label })),
              getValue: (u) => u.role,
            },
            {
              id: "status",
              allLabel: "Tous les statuts",
              options: [
                { value: "active", label: "Actif" },
                { value: "inactive", label: "Inactif" },
              ],
              getValue: (u) => (u.isActive ? "active" : "inactive"),
            },
          ]}
        />
      </TabsContent>

      <TabsContent value="roles">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {rolePermissions.map((r) => (
            <Card key={r.role} className="shadow-xs ring-foreground/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="size-4.5 text-primary" />
                  {r.role}
                </CardTitle>
                <CardDescription>{r.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {r.permissions.map((p) => (
                    <StatusPill key={p} tone="neutral" className="text-[10.5px]">
                      {p}
                    </StatusPill>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="security">
        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Sécurité de la plateforme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label className="flex items-center justify-between gap-4 rounded-lg border p-4 font-normal">
              <span>
                <span className="block font-medium">Authentification à deux facteurs</span>
                <span className="block text-xs text-muted-foreground">Obligatoire pour tous les utilisateurs.</span>
              </span>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
            </Label>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Expiration de session">
                <FilterSelect
                  items={[
                    { value: "5", label: "5 minutes" },
                    { value: "15", label: "15 minutes" },
                    { value: "30", label: "30 minutes" },
                  ]}
                  value={sessionTimeout}
                  onChange={setSessionTimeout}
                  className="w-full text-sm"
                />
              </FormField>
              <FormField label="Longueur min. du mot de passe" htmlFor="pwd">
                <Input id="pwd" type="number" defaultValue={12} min={8} />
              </FormField>
              <FormField label="Tentatives avant verrouillage" htmlFor="attempts">
                <Input id="attempts" type="number" defaultValue={5} min={3} />
              </FormField>
            </div>
            <Button onClick={() => toast.success("Paramètres de sécurité enregistrés")}>Enregistrer</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="institution">
        <Card className="shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="font-semibold">Établissement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Raison sociale" htmlFor="org">
                <Input id="org" defaultValue="Accès Finance SA" />
              </FormField>
              <FormField label="Agrément BCC" htmlFor="licence">
                <Input id="licence" defaultValue="BCC/IMF/0042" />
              </FormField>
              <FormField label="Siège" htmlFor="hq">
                <Input id="hq" defaultValue="Boulevard Kanyamuhanga, Goma" />
              </FormField>
              <FormField label="Contact support" htmlFor="support">
                <Input id="support" type="email" defaultValue="support@accesfinance.cd" />
              </FormField>
            </div>
            <Button onClick={() => toast.success("Informations enregistrées")}>Enregistrer</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
