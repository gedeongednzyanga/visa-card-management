import type { CardRequest } from "./types.ts"

// ---- CBS BankSoft -------------------------------------------------------
// Le CBS répond HTTP 200 même pour une erreur applicative, et rejette un
// requestId déjà vu (409). L'adaptateur réel traduit ces comportements dans
// les résultats ci-dessous ; le noyau ne connaît ni HTTP ni chiffrement.

export type CbsDebitResult =
  | { kind: "ok"; reference: string }
  | { kind: "insufficient_funds" }
  | { kind: "rejected"; code: string; message: string } // compte bloqué, inexistant...
  | { kind: "not_applied"; message: string } // certain que rien n'a été débité : on peut réessayer
  | { kind: "unknown"; message: string } // timeout après envoi : on ne sait pas si c'est débité
  | { kind: "duplicate" } // requestId déjà vu : une tentative précédente a peut-être abouti

export type CbsRefundResult =
  | { kind: "ok"; reference: string }
  | { kind: "not_applied"; message: string }
  | { kind: "unknown"; message: string }
  | { kind: "duplicate" }
  | { kind: "rejected"; code: string; message: string }

export interface CbsPort {
  debit(input: { requestId: string; accountNumber: string; amountCents: number; currency: "USD"; description: string }): Promise<CbsDebitResult>
  refund(input: { requestId: string; accountNumber: string; originalReference: string; amountCents: number; currency: "USD"; description: string }): Promise<CbsRefundResult>
}

// ---- KardPay ------------------------------------------------------------
export type IssueResult =
  | { kind: "issued"; cardId: string } // 201
  | { kind: "accepted"; status: "pending" | "awaiting_funds"; cardId?: string } // 202
  | { kind: "retryable"; code: string; message: string } // 5xx, insufficient_escrow_balance... : même clé
  | { kind: "permanent"; code: string; message: string } // refus définitif

export interface KardPayPort {
  issueCard(input: { idempotencyKey: string; amountCents: number }): Promise<IssueResult>
}

// ---- Persistance --------------------------------------------------------
export class ConflictError extends Error {
  constructor(id: string) {
    super(`Conflit de version sur la demande ${id} : elle a été modifiée entre-temps.`)
  }
}

export interface RequestRepository {
  /** Insère une nouvelle demande (version 0 attendue). */
  create(request: CardRequest): Promise<void>
  get(id: string): Promise<CardRequest | undefined>
  findByClientToken(clientToken: string): Promise<CardRequest | undefined>
  findByCardId(cardId: string): Promise<CardRequest | undefined>
  /** Sauvegarde si `request.version` correspond à la version stockée, puis l'incrémente ; sinon ConflictError. */
  save(request: CardRequest): Promise<CardRequest>
  /** Demandes non terminales à (re)faire avancer. */
  listActionable(): Promise<CardRequest[]>
  /** true la première fois que cet identifiant d'événement est vu, false ensuite. */
  markEventSeen(eventId: string): Promise<boolean>
}
