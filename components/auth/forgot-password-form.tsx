"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/shared/form-field"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="space-y-6">
      <Link
        href="/connexion"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour à la connexion
      </Link>

      {sent ? (
        <div className="space-y-2">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MailCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Vérifiez vos e-mails</h1>
          <p className="text-sm text-muted-foreground">
            Si un compte existe pour <span className="font-medium text-foreground">{email}</span>, un lien de
            réinitialisation valable 30 minutes vient d&apos;être envoyé.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Mot de passe oublié</h1>
            <p className="text-sm text-muted-foreground">
              Saisissez votre adresse e-mail professionnelle pour recevoir un lien de réinitialisation.
            </p>
          </div>
          <FormField label="Adresse e-mail" htmlFor="email">
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom@accesfinance.cd"
                className="h-10 pl-9"
              />
            </div>
          </FormField>
          <Button type="submit" className="h-10 w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Envoyer le lien
          </Button>
        </form>
      )}
    </div>
  )
}
