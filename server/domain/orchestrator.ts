import { ConflictError } from "./ports.ts"
import type { CbsDebitResult, CbsPort, CbsRefundResult, IssueResult, KardPayPort, RequestRepository } from "./ports.ts"
import { TERMINAL_STATUSES } from "./types.ts"
import type { CardEvent, CardRequest, CardRequestStatus, RequestError, SubmitInput } from "./types.ts"

// Automate "réserver puis confirmer" entre le CBS (débit) et KardPay
// (émission). Chaque appel à `advance` fait AU PLUS UN pas externe, puis
// sauvegarde. Reprise après panne : on rappelle `advance` ; l'état stocké dit
// où on en était.
//
// Garanties recherchées (chacune a un test dans server/tests) :
//  - jamais deux débits pour une même demande (requestId CBS = id de la demande) ;
//  - jamais deux cartes pour une même demande (Idempotency-Key KardPay = id) ;
//  - un résultat CBS incertain (timeout, doublon) n'est JAMAIS réessayé à
//    l'aveugle : la demande passe en `needs_review` ;
//  - un échec définitif d'émission déclenche le remboursement ;
//  - un webhook rejoué ou arrivé dans le désordre ne casse rien.

export class ValidationError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export interface OrchestratorConfig {
  /** Recharge minimale imposée par la banque (20 $). */
  minCents: number
  /** Recharge maximale par top-up annoncée par KardPay (5 000 $, relevable). */
  maxCents: number
  maxAttempts: number
  issuerTimeoutMs: number
}

export const DEFAULT_CONFIG: OrchestratorConfig = {
  minCents: 2_000,
  maxCents: 500_000,
  maxAttempts: 5,
  issuerTimeoutMs: 30 * 60 * 1000,
}

export interface OrchestratorDeps {
  repo: RequestRepository
  cbs: CbsPort
  kardpay: KardPayPort
  now: () => Date
  newId: () => string
  config?: Partial<OrchestratorConfig>
}

export class CardOrchestrator {
  private repo: RequestRepository
  private cbs: CbsPort
  private kardpay: KardPayPort
  private now: () => Date
  private newId: () => string
  private config: OrchestratorConfig

  constructor(deps: OrchestratorDeps) {
    this.repo = deps.repo
    this.cbs = deps.cbs
    this.kardpay = deps.kardpay
    this.now = deps.now
    this.newId = deps.newId
    this.config = { ...DEFAULT_CONFIG, ...deps.config }
  }

  // ---- Entrée ---------------------------------------------------------

  async submit(input: SubmitInput): Promise<CardRequest> {
    const existing = await this.repo.findByClientToken(input.clientToken)
    if (existing) return existing // double clic / rejeu : même demande, aucun effet de bord

    if (!input.clientToken) throw new ValidationError("client_token_required", "clientToken requis.")
    if (!input.clientId) throw new ValidationError("client_required", "Client requis.")
    if (!/^\d{6,20}$/.test(input.accountNumber)) throw new ValidationError("invalid_account", "Numéro de compte invalide.")
    if (!Number.isInteger(input.amountCents)) throw new ValidationError("invalid_amount", "Montant invalide.")
    if (input.amountCents < this.config.minCents) {
      throw new ValidationError("amount_too_low", `Recharge minimale : ${this.config.minCents / 100} USD.`)
    }
    if (input.amountCents > this.config.maxCents) {
      throw new ValidationError("amount_too_high", `Recharge maximale : ${this.config.maxCents / 100} USD.`)
    }

    const at = this.now().toISOString()
    const request: CardRequest = {
      id: this.newId(),
      clientToken: input.clientToken,
      clientId: input.clientId,
      accountNumber: input.accountNumber,
      amountCents: input.amountCents,
      currency: "USD",
      createdBy: input.createdBy,
      status: "requested",
      attempts: { debit: 0, issue: 0, refund: 0 },
      history: [{ at, status: "requested", note: "Demande enregistrée." }],
      version: 0,
      createdAt: at,
      updatedAt: at,
    }
    await this.repo.create(request)
    return request
  }

  // ---- Un pas ---------------------------------------------------------

  async advance(id: string): Promise<CardRequest> {
    const request = await this.repo.get(id)
    if (!request) throw new Error(`Demande ${id} introuvable.`)
    switch (request.status) {
      case "requested":
        return this.debitStep(request)
      case "debited":
        return this.issueStep(request)
      case "refund_pending":
        return this.refundStep(request)
      case "awaiting_issuer":
        return this.timeoutStep(request)
      default:
        return request // état terminal
    }
  }

  /** Enchaîne les pas tant que l'état change ; s'arrête sur un état terminal, une attente ou une relance sans progrès. */
  async run(id: string, maxSteps = 10): Promise<CardRequest> {
    let current = await this.advance(id)
    for (let i = 1; i < maxSteps; i++) {
      const before = current.status
      if (TERMINAL_STATUSES.includes(before) || before === "awaiting_issuer") break
      const next = await this.advance(id)
      if (next.status === before) return next
      current = next
    }
    return current
  }

  /** Une passe du worker : fait avancer chaque demande non terminale d'un pas. */
  async tick(): Promise<{ advanced: number; conflicts: number }> {
    let advanced = 0
    let conflicts = 0
    for (const r of await this.repo.listActionable()) {
      try {
        await this.advance(r.id)
        advanced++
      } catch (e) {
        if (e instanceof ConflictError) conflicts++
        else throw e
      }
    }
    return { advanced, conflicts }
  }

  // ---- Webhooks -------------------------------------------------------

  async handleWebhook(event: CardEvent): Promise<"processed" | "duplicate" | "unmatched"> {
    const request =
      (event.idempotencyKey ? await this.repo.get(event.idempotencyKey) : undefined) ?? (await this.repo.findByCardId(event.cardId))
    // Pas encore rattachable (202 sans cardId reçu) : on NE marque PAS l'événement
    // comme vu, pour qu'une nouvelle livraison par KardPay puisse l'appliquer.
    if (!request) return "unmatched"

    let next: CardRequest | undefined
    if (event.kind === "card_issued") {
      if (request.status === "awaiting_issuer" || request.status === "debited") {
        next = this.transition(request, "issued", "Carte confirmée par KardPay (webhook).", { kardpayCardId: event.cardId })
      } else if (request.status === "refund_pending" || request.status === "failed_refunded") {
        // Carte émise alors qu'on avait engagé ou fait le remboursement : perte possible.
        next = this.transition(request, "needs_review", "Carte émise ALORS que le remboursement était engagé : vérifier d'urgence.", {
          kardpayCardId: event.cardId,
          lastError: this.error("webhook", "issued_after_refund", "Carte émise après remboursement."),
        })
      }
    } else if (event.kind === "card_failed") {
      if (request.status === "awaiting_issuer" || request.status === "debited") {
        next = this.transition(request, "refund_pending", "Émission refusée par KardPay (webhook) : remboursement à faire.", {
          lastError: this.error("webhook", "card_failed", "KardPay a signalé un échec d'émission."),
        })
      }
    }
    if (next) await this.repo.save(next)
    return (await this.repo.markEventSeen(event.eventId)) ? "processed" : "duplicate"
  }

  // ---- Pas internes ---------------------------------------------------

  private async debitStep(request: CardRequest): Promise<CardRequest> {
    const working = this.bump(request, "debit")
    let result: CbsDebitResult
    try {
      result = await this.cbs.debit({
        requestId: request.id,
        accountNumber: request.accountNumber,
        amountCents: request.amountCents,
        currency: request.currency,
        description: `Carte virtuelle ${request.id}`,
      })
    } catch (e) {
      // Exception inattendue pendant le débit : on ne sait pas si c'est passé.
      result = { kind: "unknown", message: e instanceof Error ? e.message : String(e) }
    }

    switch (result.kind) {
      case "ok":
        return this.repo.save(this.transition(working, "debited", `Compte débité (réf. ${result.reference}).`, { cbsDebitRef: result.reference }))
      case "insufficient_funds":
        return this.repo.save(
          this.transition(working, "rejected", "Solde insuffisant, rien n'a été débité.", {
            lastError: this.error("debit", "insufficient_funds", "Solde insuffisant."),
          })
        )
      case "rejected":
        return this.repo.save(
          this.transition(working, "rejected", `Débit refusé par le CBS : ${result.message}`, {
            lastError: this.error("debit", result.code, result.message),
          })
        )
      case "not_applied":
        if (working.attempts.debit >= this.config.maxAttempts) {
          return this.repo.save(
            this.transition(working, "rejected", "CBS indisponible après plusieurs essais, rien n'a été débité.", {
              lastError: this.error("debit", "cbs_unavailable", result.message),
            })
          )
        }
        return this.repo.save(this.annotate(working, `Débit non appliqué, nouvelle tentative : ${result.message}`, this.error("debit", "not_applied", result.message)))
      case "unknown":
      case "duplicate":
        return this.repo.save(
          this.transition(
            working,
            "needs_review",
            "Résultat du débit CBS incertain : vérifier le relevé du compte (requestId = id de la demande) avant toute action.",
            { lastError: this.error("debit", result.kind, "Débit CBS : résultat incertain.") }
          )
        )
    }
  }

  private async issueStep(request: CardRequest): Promise<CardRequest> {
    const working = this.bump(request, "issue")
    let result: IssueResult
    try {
      result = await this.kardpay.issueCard({ idempotencyKey: request.id, amountCents: request.amountCents })
    } catch (e) {
      // Avec une Idempotency-Key, rejouer est sûr : on réessaiera avec la même clé.
      result = { kind: "retryable", code: "exception", message: e instanceof Error ? e.message : String(e) }
    }

    switch (result.kind) {
      case "issued":
        return this.repo.save(this.transition(working, "issued", `Carte émise (${result.cardId}).`, { kardpayCardId: result.cardId }))
      case "accepted":
        return this.repo.save(
          this.transition(working, "awaiting_issuer", `Émission acceptée par KardPay (${result.status}) : attente du webhook.`, {
            kardpayCardId: result.cardId ?? working.kardpayCardId,
          })
        )
      case "retryable":
        if (working.attempts.issue >= this.config.maxAttempts) {
          return this.repo.save(
            this.transition(working, "refund_pending", `Émission impossible après ${working.attempts.issue} essais : remboursement à faire.`, {
              lastError: this.error("issue", result.code, result.message),
            })
          )
        }
        return this.repo.save(this.annotate(working, `Émission à réessayer (même clé) : ${result.message}`, this.error("issue", result.code, result.message)))
      case "permanent":
        return this.repo.save(
          this.transition(working, "refund_pending", `Émission refusée : ${result.message}. Remboursement à faire.`, {
            lastError: this.error("issue", result.code, result.message),
          })
        )
    }
  }

  private async refundStep(request: CardRequest): Promise<CardRequest> {
    const working = this.bump(request, "refund")
    let result: CbsRefundResult
    try {
      result = await this.cbs.refund({
        requestId: `${request.id}-refund`,
        accountNumber: request.accountNumber,
        originalReference: request.cbsDebitRef ?? "",
        amountCents: request.amountCents,
        currency: request.currency,
        description: `Remboursement carte virtuelle ${request.id}`,
      })
    } catch (e) {
      result = { kind: "unknown", message: e instanceof Error ? e.message : String(e) }
    }

    switch (result.kind) {
      case "ok":
        return this.repo.save(this.transition(working, "failed_refunded", `Client remboursé (réf. ${result.reference}).`, { cbsRefundRef: result.reference }))
      case "not_applied":
        if (working.attempts.refund >= this.config.maxAttempts) {
          return this.repo.save(
            this.transition(working, "needs_review", "Remboursement CBS impossible après plusieurs essais : le client reste débité.", {
              lastError: this.error("refund", "cbs_unavailable", result.message),
            })
          )
        }
        return this.repo.save(this.annotate(working, `Remboursement non appliqué, nouvelle tentative : ${result.message}`, this.error("refund", "not_applied", result.message)))
      case "unknown":
      case "duplicate":
      case "rejected":
        return this.repo.save(
          this.transition(working, "needs_review", "Remboursement CBS incertain ou refusé : le client est peut-être encore débité, vérifier le relevé.", {
            lastError: this.error("refund", result.kind, result.kind === "unknown" || result.kind === "rejected" ? result.message : "Doublon de requestId.")
          })
        )
    }
  }

  private async timeoutStep(request: CardRequest): Promise<CardRequest> {
    const waitedMs = this.now().getTime() - new Date(request.updatedAt).getTime()
    if (waitedMs <= this.config.issuerTimeoutMs) return request
    return this.repo.save(
      this.transition(request, "needs_review", "Aucune confirmation de KardPay dans le délai : vérifier l'état de la carte chez KardPay.", {
        lastError: this.error("timeout", "issuer_timeout", "Pas de webhook de confirmation.")
      })
    )
  }

  // ---- Utilitaires purs -----------------------------------------------

  private bump(request: CardRequest, step: "debit" | "issue" | "refund"): CardRequest {
    return { ...request, attempts: { ...request.attempts, [step]: request.attempts[step] + 1 } }
  }

  private error(step: RequestError["step"], code: string, message: string): RequestError {
    return { step, code, message, at: this.now().toISOString() }
  }

  private transition(request: CardRequest, status: CardRequestStatus, note: string, patch: Partial<CardRequest> = {}): CardRequest {
    const at = this.now().toISOString()
    return { ...request, ...patch, status, updatedAt: at, history: [...request.history, { at, status, note }] }
  }

  /** Reste dans le même état (relance prévue) en gardant une trace. */
  private annotate(request: CardRequest, note: string, lastError: RequestError): CardRequest {
    const at = this.now().toISOString()
    return { ...request, lastError, updatedAt: at, history: [...request.history, { at, status: request.status, note }] }
  }
}
