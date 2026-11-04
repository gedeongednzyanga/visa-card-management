import type { IssueResult, KardPayPort } from "../domain/ports.ts"

// Faux KardPay : idempotent sur la clé (comme le vrai), avec des pannes
// scriptables. Aucun coût, aucun réseau.
export type FakeKardPayMode = "ok" | "retryable" | "permanent" | "accepted" | "throw"

export class FakeKardPay implements KardPayPort {
  issueScript: FakeKardPayMode[] = []
  /** clé d'idempotence -> identifiant de carte */
  cards = new Map<string, string>()
  issueCalls: string[] = []
  private seq = 0

  async issueCard(input: { idempotencyKey: string; amountCents: number }): Promise<IssueResult> {
    this.issueCalls.push(input.idempotencyKey)
    const mode = this.issueScript.shift() ?? "ok"
    if (mode === "throw") throw new Error("coupure réseau")
    if (mode === "retryable") return { kind: "retryable", code: "insufficient_escrow_balance", message: "Solde de l'escrow insuffisant." }
    if (mode === "permanent") return { kind: "permanent", code: "product_unavailable", message: "Produit indisponible." }

    // Rejeu avec la même clé : même carte, jamais une seconde.
    const existing = this.cards.get(input.idempotencyKey)
    const cardId = existing ?? `card_${++this.seq}`
    this.cards.set(input.idempotencyKey, cardId)
    return mode === "accepted" ? { kind: "accepted", status: "pending", cardId } : { kind: "issued", cardId }
  }
}
