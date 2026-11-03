import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { apiFetch, type AuthResponse } from "@/lib/api"
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  isTokenExpired,
  setSessionCookies,
} from "@/lib/session"

const PUBLIC_PATHS = ["/connexion", "/mot-de-passe-oublie"]

// Page de test CBS BankSoft (voir app/test-cbs + app/api/cbs/lookup) : pas
// de session dashboard exigée, seulement en dehors de production — même
// logique que SESSION_REQUIRED dans app/api/cbs/lookup/route.ts. acces-register
// n'a aucun rapport avec ce qu'on y vérifie.
const DEV_ONLY_PUBLIC_PATHS = ["/test-cbs", "/api/cbs"]

// Protège les pages du tableau de bord et renouvelle le jeton d'accès expiré.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next()
  if (process.env.NODE_ENV !== "production" && DEV_ONLY_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  if (accessToken && !isTokenExpired(accessToken)) return NextResponse.next()

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  if (refreshToken && !isTokenExpired(refreshToken)) {
    try {
      const tokens = await apiFetch<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      })
      // Nouveaux jetons visibles par le rendu de cette requête et enregistrés dans le navigateur.
      request.cookies.set(ACCESS_COOKIE, tokens.accessToken)
      request.cookies.set(REFRESH_COOKIE, tokens.refreshToken)
      const response = NextResponse.next({ request: { headers: request.headers } })
      setSessionCookies(response.cookies, tokens)
      return response
    } catch {
      // Refresh token révoqué ou API injoignable : retour à la connexion.
    }
  }

  const response = NextResponse.redirect(new URL("/connexion", request.url))
  clearSessionCookies(response.cookies)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
}
