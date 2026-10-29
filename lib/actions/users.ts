"use server"

import { ApiError, apiFetch, type ApiUser, type AuthResponse } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth"

export type CreateUserInput = {
  firstName: string
  lastName: string
  email: string
  password: string
}

export type CreateUserResult = { ok: true; user: ApiUser } | { ok: false; error: string }

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const currentUser = await getCurrentUser()
  if (currentUser.role !== "admin") {
    return { ok: false, error: "Seul un administrateur peut créer des utilisateurs." }
  }

  try {
    // Les jetons renvoyés sont ceux du nouvel utilisateur : on les ignore pour garder la session de l'administrateur.
    const { user } = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim(),
        password: input.password,
      }),
    })
    return { ok: true, user }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof ApiError ? e.message : "Une erreur inattendue est survenue.",
    }
  }
}
