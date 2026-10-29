// Client HTTP de l'API acces-register (appelé uniquement côté serveur).
const API_URL = process.env.API_URL ?? "http://localhost:3000/api"

export type ApiUser = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: "admin" | "user"
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type AuthResponse = {
  user: ApiUser
  accessToken: string
  refreshToken: string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}

export async function apiFetch<T>(
  path: string,
  { token, headers, ...init }: RequestInit & { token?: string } = {}
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
    })
  } catch {
    throw new ApiError(0, "Le serveur d'authentification est injoignable.")
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    // NestJS renvoie { message: string | string[] } (tableau pour les erreurs de validation).
    const message = body?.message
    throw new ApiError(
      res.status,
      Array.isArray(message) ? message.join(" ") : (message ?? "Une erreur inattendue est survenue.")
    )
  }
  return body as T
}
