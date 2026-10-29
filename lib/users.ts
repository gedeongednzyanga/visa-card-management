import type { ApiUser } from "./api"
import { authFetch } from "./auth"

// Réservé aux administrateurs (403 sinon).
export function getUsers() {
  return authFetch<ApiUser[]>("/users")
}
