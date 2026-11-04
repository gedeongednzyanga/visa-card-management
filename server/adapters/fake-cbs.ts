import type { CbsDebitResult, CbsPort, CbsRefundResult } from "../domain/ports.ts"

// Faux CBS pour les tests et le développement sans dépendance externe. Imite
// les comportements réels constatés en UAT : un requestId déjà vu est rejeté
// (doublon), et une réponse peut se perdre APRÈS que l'opération a été
// appliquée ("lost_response") — le cas le plus dangereux.
export type FakeCbsMode = "ok" | "not_applied" | "lost_response" | "rejected"

export class FakeCbs implements CbsPort {
  balances = new Map<string, number>()
  debits = new Map<string, { reference: string; accountNumber: string; amountCents: number }>()
  refunds = new Map<string, { reference: string; accountNumber: string; amountCents: number }>()
  debitScript: FakeCbsMode[] = []
  refundScript: FakeCbsMode[] = []
  debitCalls = 0
  refundCalls = 0
  private seq = 0

  setBalance(accountNumber: string, cents: number) {
    this.balances.set(accountNumber, cents)
  }

  balance(accountNumber: string) {
    return this.balances.get(accountNumber) ?? 0
  }

  async debit(input: Parameters<CbsPort["debit"]>[0]): Promise<CbsDebitResult> {
    this.debitCalls++
    const mode = this.debitScript.shift() ?? "ok"
    if (mode === "not_applied") return { kind: "not_applied", message: "connexion refusée" }
    if (this.debits.has(input.requestId)) return { kind: "duplicate" }
    if (mode === "rejected") return { kind: "rejected", code: "account_blocked", message: "Compte bloqué" }
    if (this.balance(input.accountNumber) < input.amountCents) return { kind: "insufficient_funds" }

    const reference = `DBT-${++this.seq}`
    this.balances.set(input.accountNumber, this.balance(input.accountNumber) - input.amountCents)
    this.debits.set(input.requestId, { reference, accountNumber: input.accountNumber, amountCents: input.amountCents })
    if (mode === "lost_response") return { kind: "unknown", message: "timeout après envoi" }
    return { kind: "ok", reference }
  }

  async refund(input: Parameters<CbsPort["refund"]>[0]): Promise<CbsRefundResult> {
    this.refundCalls++
    const mode = this.refundScript.shift() ?? "ok"
    if (mode === "not_applied") return { kind: "not_applied", message: "connexion refusée" }
    if (this.refunds.has(input.requestId)) return { kind: "duplicate" }
    if (mode === "rejected") return { kind: "rejected", code: "refund_refused", message: "Remboursement refusé" }

    const reference = `RFD-${++this.seq}`
    this.balances.set(input.accountNumber, this.balance(input.accountNumber) + input.amountCents)
    this.refunds.set(input.requestId, { reference, accountNumber: input.accountNumber, amountCents: input.amountCents })
    if (mode === "lost_response") return { kind: "unknown", message: "timeout après envoi" }
    return { kind: "ok", reference }
  }
}
