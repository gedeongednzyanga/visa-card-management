"use client"

import { useState } from "react"
import { MoreHorizontal, Plus, ShieldCheck } from "lucide-react"
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
import { rolePermissions, users as initialUsers, type AppUser, type UserRole } from "@/lib/data/operations"
import { agencies } from "@/lib/data/seed"

const roles = rolePermissions.map((r) => r.role)

function NewUserDialog({ onCreate }: { onCreate: (user: AppUser) => void }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<string>("Agent")
  const [agency, setAgency] = useState<string>(agencies[0])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get("name"))
    onCreate({
      id: `USR-${Date.now()}`,
      name,
      initials: name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
      email: String(form.get("email")),
      role: role as UserRole,
      agency,
      lastLogin: "Jamais",
      active: true,
    })
    toast.success(`Invitation envoyée à ${form.get("email")}`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-9" />}>
        <Plus /> Ajouter un utilisateur
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
          </DialogHeader>
          <FormField label="Nom complet" htmlFor="u-name">
            <Input id="u-name" name="name" required />
          </FormField>
          <FormField label="E-mail professionnel" htmlFor="u-email">
            <Input id="u-email" name="email" type="email" required placeholder="prenom@accesfinance.cd" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Rôle">
              <FilterSelect items={roles.map((r) => ({ value: r, label: r }))} value={role} onChange={setRole} className="w-full text-sm" />
            </FormField>
            <FormField label="Agence">
              <FilterSelect items={agencies.map((a) => ({ value: a, label: a }))} value={agency} onChange={setAgency} className="w-full text-sm" />
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Annuler</DialogClose>
            <Button type="submit">Envoyer l&apos;invitation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SystemSettingsView() {
  const [users, setUsers] = useState(initialUsers)
  const [twoFactor, setTwoFactor] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState("15")

  function toggleActive(user: AppUser) {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)))
    toast.success(`${user.name} ${user.active ? "désactivé" : "réactivé"}`)
  }

  const columns: Column<AppUser>[] = [
    {
      header: "Utilisateur",
      cell: (u) => (
        <span className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px] font-semibold">{u.initials}</AvatarFallback>
          </Avatar>
          <span>
            <span className="block font-medium">{u.name}</span>
            <span className="block text-muted-foreground">{u.email}</span>
          </span>
        </span>
      ),
    },
    {
      header: "Rôle",
      cell: (u) => (
        <StatusPill tone={u.role === "Administrateur" ? "purple" : "info"} className="text-[10.5px]">
          {u.role}
        </StatusPill>
      ),
    },
    { header: "Agence", cell: (u) => u.agency },
    { header: "Dernière connexion", cell: (u) => u.lastLogin },
    { header: "Statut", cell: (u) => <ActivePill active={u.active} /> },
    {
      header: "Actions",
      className: "text-center",
      cell: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="icon-sm" className="h-6 w-8" aria-label={`Actions pour ${u.name}`} />}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => toast.info(`Lien de réinitialisation envoyé à ${u.email}`)}>
              Réinitialiser le mot de passe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant={u.active ? "destructive" : "default"} onClick={() => toggleActive(u)}>
              {u.active ? "Désactiver" : "Réactiver"}
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
          rowKey={(u) => u.id}
          itemLabel="utilisateurs"
          exportable={false}
          searchPlaceholder="Rechercher par nom, e-mail..."
          searchText={(u) => `${u.name} ${u.email}`}
          filters={[
            {
              id: "role",
              allLabel: "Tous les rôles",
              options: roles.map((r) => ({ value: r, label: r })),
              getValue: (u) => u.role,
            },
            {
              id: "agency",
              allLabel: "Toutes les agences",
              options: agencies.map((a) => ({ value: a, label: a })),
              getValue: (u) => u.agency,
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
                <p className="text-xs text-muted-foreground">
                  {users.filter((u) => u.role === r.role).length} utilisateur(s)
                </p>
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
