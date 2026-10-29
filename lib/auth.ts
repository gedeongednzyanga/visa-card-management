import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ApiError, apiFetch, type ApiUser } from "./api"
import { ACCESS_COOKIE } from "./session"

export type CurrentUser = Pick<ApiUser, "id" | "firstName" | "lastName" | "email" | "role">

// Appel authentifié à l'API avec le jeton d'accès (déjà renouvelé si besoin par proxy.ts).
export async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value
  if (!token) redirect("/connexion")

  try {
    return await apiFetch<T>(path, { ...init, token })
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/connexion")
    throw e
  }
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const { id, firstName, lastName, email, role } = await authFetch<ApiUser>("/auth/me")
  return { id, firstName, lastName, email, role }
}
