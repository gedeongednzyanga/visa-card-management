import { ConflictError } from "../domain/ports.ts"
import type { RequestRepository } from "../domain/ports.ts"
import { TERMINAL_STATUSES } from "../domain/types.ts"
import type { CardRequest } from "../domain/types.ts"

// Dépôt en mémoire : sert aux tests et au développement. La version PostgreSQL
// (ou autre, à décider) devra reproduire les mêmes garanties : contrainte
// d'unicité sur clientToken et sur l'identifiant d'événement, et
// `UPDATE ... WHERE id = $1 AND version = $2` pour le contrôle optimiste.
export class MemoryRepository implements RequestRepository {
  private requests = new Map<string, CardRequest>()
  private events = new Set<string>()

  async create(request: CardRequest): Promise<void> {
    if (this.requests.has(request.id)) throw new Error(`Demande ${request.id} déjà existante.`)
    for (const r of this.requests.values()) {
      if (r.clientToken === request.clientToken) throw new Error("clientToken déjà utilisé.")
    }
    this.requests.set(request.id, structuredClone(request))
  }

  async get(id: string) {
    const r = this.requests.get(id)
    return r ? structuredClone(r) : undefined
  }

  async findByClientToken(clientToken: string) {
    for (const r of this.requests.values()) if (r.clientToken === clientToken) return structuredClone(r)
    return undefined
  }

  async findByCardId(cardId: string) {
    for (const r of this.requests.values()) if (r.kardpayCardId === cardId) return structuredClone(r)
    return undefined
  }

  async save(request: CardRequest) {
    const stored = this.requests.get(request.id)
    if (!stored || stored.version !== request.version) throw new ConflictError(request.id)
    const next = structuredClone({ ...request, version: request.version + 1 })
    this.requests.set(request.id, next)
    return structuredClone(next)
  }

  async listActionable() {
    return [...this.requests.values()].filter((r) => !TERMINAL_STATUSES.includes(r.status)).map((r) => structuredClone(r))
  }

  async markEventSeen(eventId: string) {
    if (this.events.has(eventId)) return false
    this.events.add(eventId)
    return true
  }
}
