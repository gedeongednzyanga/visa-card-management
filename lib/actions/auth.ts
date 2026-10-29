"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ApiError, apiFetch, type AuthResponse } from "@/lib/api"
import { ACCESS_COOKIE, clearSessionCookies, setSessionCookies } from "@/lib/session"

export type LoginResult = { ok: true; firstName: string; lastName: string } | { ok: false; error: string }

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const { user, ...tokens } = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    })
    setSessionCookies(await cookies(), tokens)
    return { ok: true, firstName: user.firstName, lastName: user.lastName }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof ApiError ? e.message : "Une erreur inattendue est survenue.",
    }
  }
}

export async function logout() {
  const store = await cookies()
  const token = store.get(ACCESS_COOKIE)?.value
  if (token) {
    // Révoque le refresh token côté API ; on déconnecte localement quoi qu'il arrive.
    await apiFetch("/auth/logout", { method: "POST", token }).catch(() => {})
  }
  clearSessionCookies(store)
  redirect("/connexion")
}
