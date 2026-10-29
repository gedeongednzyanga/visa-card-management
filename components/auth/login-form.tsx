"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormField } from "@/components/shared/form-field"
import { login } from "@/lib/actions/auth"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await login(email, password)
    if (!result.ok) {
      setLoading(false)
      setError(result.error)
      return
    }
    toast.success(`Bienvenue, ${result.firstName} ${result.lastName}`)
    router.push("/tableau-de-bord")
  }

  return (
    <form onSubmit={handleCredentials} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Accédez à votre espace de gestion des cartes virtuelles.
        </p>
      </div>

      <div className="space-y-4">
        <FormField label="Adresse e-mail" htmlFor="email">
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@accesfinance.cd"
              className="h-10 pl-9"
              aria-invalid={!!error}
            />
          </div>
        </FormField>

        <FormField label="Mot de passe" htmlFor="password">
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="h-10 px-9"
              aria-invalid={!!error}
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

        <div className="flex items-center justify-between gap-4">
          <Label className="flex items-center gap-2 font-normal">
            <Checkbox defaultChecked /> Se souvenir de moi
          </Label>
          <Link href="/mot-de-passe-oublie" className="text-sm font-medium text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <Button type="submit" className="h-10 w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />}
        Se connecter
      </Button>
    </form>
  )
}
