"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { FormField } from "@/components/shared/form-field"

// Données de démonstration : à remplacer par l'appel à l'API d'authentification.
const DEMO_EMAIL = "gedeon@accesfinance.cd"
const DEMO_PASSWORD = "AccesFinance2026"
const DEMO_OTP = "12345678"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    await wait(600)
    setLoading(false)
    if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      setError("Adresse e-mail ou mot de passe incorrect.")
      return
    }
    setStep("otp")
    toast.info("Code de vérification envoyé", { description: "Un SMS a été envoyé au +243 97 ••• ••12." })
  }

  async function verifyOtp(code: string) {
    setError(null)
    setLoading(true)
    await wait(600)
    if (code !== DEMO_OTP) {
      setLoading(false)
      setOtp("")
      setError("Code de vérification invalide.")
      return
    }
    toast.success("Bienvenue, Daniel Balinda")
    router.push("/tableau-de-bord")
  }

  if (step === "otp") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          verifyOtp(otp)
        }}
        className="space-y-6"
      >
        <button
          type="button"
          onClick={() => {
            setStep("credentials")
            setOtp("")
            setError(null)
          }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Retour
        </button>

        <div className="space-y-2">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Vérification en deux étapes</h1>
          <p className="text-sm text-muted-foreground">
            Saisissez le code à 6 chiffres envoyé par SMS au{" "}
            <span className="whitespace-nowrap font-medium text-foreground">+243 97 ••• ••12</span>.
          </p>
        </div>

        <div className="space-y-2">
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={otp}
            onChange={setOtp}
            onComplete={verifyOtp}
            disabled={loading}
            autoFocus
            aria-label="Code de vérification"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="size-12 text-lg" />
              <InputOTPSlot index={1} className="size-12 text-lg" />
              <InputOTPSlot index={2} className="size-12 text-lg" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} className="size-12 text-lg" />
              <InputOTPSlot index={4} className="size-12 text-lg" />
              <InputOTPSlot index={5} className="size-12 text-lg" />
            </InputOTPGroup>
          </InputOTP>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="h-10 w-full" disabled={loading || otp.length < 6}>
          {loading && <Loader2 className="animate-spin" />}
          Vérifier
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Code non reçu ?{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => toast.info("Un nouveau code a été envoyé")}
          >
            Renvoyer le code
          </button>
        </p>
      </form>
    )
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

      <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Compte de démonstration</p>
        <p>
          {DEMO_EMAIL} · {DEMO_PASSWORD} · code {DEMO_OTP}
        </p>
      </div>
    </form>
  )
}
