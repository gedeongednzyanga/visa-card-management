import type { CardRequest, CardRequestStatus, FeeSchedule } from "./types.ts"

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

export interface CbsPort {
  debit(input: { requestId: string; accountNumber: string; amountCents: number; currency: "USD"; description: string }): Promise<CbsDebitResult>
  // Pas de refund() : le remboursement est fait à la main par la comptabilité
  // (décision du 04/11/2026), ce qui évite aussi de dépendre d'une opération
  // d'annulation CBS non documentée.
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
  /** Demandes que l'automate fait avancer seul (hors attente humaine et états terminaux). */
  listActionable(): Promise<CardRequest[]>
  listByStatus(status: CardRequestStatus): Promise<CardRequest[]>
  /** true la première fois que cet identifiant d'événement est vu, false ensuite. */
  markEventSeen(eventId: string): Promise<boolean>
}

// ---- Tarification -------------------------------------------------------
export class NoFeeScheduleError extends Error {
  constructor() {
    super("Aucune grille tarifaire en vigueur : à publier depuis le dashboard avant toute émission.")
  }
}

export interface PricingPort {
  /** Grille en vigueur à cet instant ; NoFeeScheduleError s'il n'y en a pas. */
  getEffective(at: Date): Promise<FeeSchedule>
}
