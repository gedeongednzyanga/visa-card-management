// Noyau métier du backend cartes virtuelles (phase 1 : squelette sans argent
// réel). Voir l'onglet "Architecture backend" du document de conformité.
//
// Contraintes de ce dossier (Node --experimental-strip-types, sans build) :
// pas d'enum, pas de propriétés de paramètres de constructeur, imports
// relatifs avec l'extension .ts, `import type` pour les types.
//
// Les montants sont des entiers en centimes : jamais de flottants pour de
// l'argent.

export type CardRequestStatus =
  | "requested" // enregistrée, rien n'est encore débité
  | "debited" // CBS débité, émission KardPay à faire
  | "awaiting_issuer" // KardPay a accepté (202), on attend le webhook
  | "issued" // carte émise — terminal
  | "refund_pending" // échec définitif de l'émission : remboursement CBS à faire
  | "failed_refunded" // échec, client remboursé — terminal
  | "needs_review" // intervention humaine requise — terminal pour l'automate
  | "rejected" // refusée avant tout débit — terminal

export const TERMINAL_STATUSES: readonly CardRequestStatus[] = ["issued", "failed_refunded", "needs_review", "rejected"]

export interface RequestError {
  step: "validation" | "debit" | "issue" | "refund" | "webhook" | "timeout"
  code: string
  message: string
  at: string
}

export interface HistoryEntry {
  at: string
  status: CardRequestStatus
  note: string
}

export interface CardRequest {
  /**
   * UUID unique de l'opération. Sert de `requestId` pour le débit CBS ET
   * d'`Idempotency-Key` pour KardPay : un rejeu ne peut ni débiter ni émettre
   * deux fois. Le remboursement CBS utilise `${id}-refund` (le CBS rejette
   * tout requestId déjà vu).
   */
  id: string
  /** UUID généré par l'interface une fois par soumission de formulaire : évite le double clic. */
  clientToken: string
  clientId: string
  accountNumber: string
  amountCents: number
  currency: "USD"
  createdBy: string
  status: CardRequestStatus
  cbsDebitRef?: string
  cbsRefundRef?: string
  kardpayCardId?: string
  attempts: { debit: number; issue: number; refund: number }
  lastError?: RequestError
  history: HistoryEntry[]
  /** Contrôle de concurrence optimiste : incrémenté à chaque sauvegarde. */
  version: number
  createdAt: string
  updatedAt: string
}

export interface SubmitInput {
  clientToken: string
  clientId: string
  accountNumber: string
  amountCents: number
  createdBy: string
}

/** Événement KardPay déjà normalisé par l'adaptateur (le format brut reste hors du noyau). */
export interface CardEvent {
  eventId: string
  kind: "card_issued" | "card_failed"
  cardId: string
  /** L'Idempotency-Key de l'émission si KardPay la restitue, sinon on retrouve par cardId. */
  idempotencyKey?: string
}
