import { ConflictError } from "./ports.ts"
import type { CbsDebitResult, CbsPort, IssueResult, KardPayPort, PricingPort, RequestRepository } from "./ports.ts"
import { computeCharges } from "./pricing.ts"
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
//  - un échec définitif d'émission passe la demande en `refund_due` : la
//    comptabilité crédite le client à la main dans le CBS puis le confirme ;
//  - un webhook rejoué ou arrivé dans le désordre ne casse rien.

export class ValidationError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export interface OrchestratorConfig {
  /** Bornes dures : la recharge minimale imposée par la banque (20 $), quelle que soit la grille. */
  minCents: number
  /** Bornes dures : la recharge maximale par top-up annoncée par KardPay (5 000 $, relevable). */
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
  pricing: PricingPort
  now: () => Date
  newId: () => string
  config?: Partial<OrchestratorConfig>
}

export class CardOrchestrator {
  private repo: RequestRepository
  private cbs: CbsPort
  private kardpay: KardPayPort
  private pricing: PricingPort
  private now: () => Date
  private newId: () => string
  private config: OrchestratorConfig

  constructor(deps: OrchestratorDeps) {
    this.repo = deps.repo
    this.cbs = deps.cbs
    this.kardpay = deps.kardpay
    this.pricing = deps.pricing
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
    // Grille en vigueur AU MOMENT de la demande ; ses bornes ne peuvent jamais
    // sortir des bornes dures (banque, KardPay).
    const schedule = await this.pricing.getEffective(this.now())
    const minCents = Math.max(schedule.minLoadCents, this.config.minCents)
    const maxCents = Math.min(schedule.maxLoadCents, this.config.maxCents)
    if (input.amountCents < minCents) throw new ValidationError("amount_too_low", `Recharge minimale : ${minCents / 100} USD.`)
    if (input.amountCents > maxCents) throw new ValidationError("amount_too_high", `Recharge maximale : ${maxCents / 100} USD.`)
    const pricing = computeCharges(schedule, input.amountCents)

    const at = this.now().toISOString()
    const request: CardRequest = {
      id: this.newId(),
      clientToken: input.clientToken,
      clientId: input.clientId,
      accountNumber: input.accountNumber,
      amountCents: input.amountCents,
      currency: "USD",
      createdBy: input.createdBy,
      pricing,
      status: "requested",
      attempts: { debit: 0, issue: 0 },
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
      if (TERMINAL_STATUSES.includes(before) || before === "awaiting_issuer" || before === "refund_due") break
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
      } else if (request.status === "refund_due" || request.status === "failed_refunded") {
        // Carte émise alors que le remboursement est dû ou déjà fait : perte possible.
        next = this.transition(request, "needs_review", "Carte émise ALORS que le remboursement était dû ou déjà fait : annuler le crédit ou bloquer la carte, vérifier d'urgence.", {
          kardpayCardId: event.cardId,
          lastError: this.error("webhook", "issued_after_refund", "Carte émise après remboursement."),
        })
      }
    } else if (event.kind === "card_failed") {
      if (request.status === "awaiting_issuer" || request.status === "debited") {
        next = this.transition(request, "refund_due", "Émission refusée par KardPay (webhook) : remboursement à faire par la comptabilité.", {
          lastError: this.error("webhook", "card_failed", "KardPay a signalé un échec d'émission."),
        })
      }
    }
    if (next) await this.repo.save(next)
    return (await this.repo.markEventSeen(event.eventId)) ? "processed" : "duplicate"
  }

  // ---- Remboursements manuels ----------------------------------------

  /** Remboursements à effectuer par la comptabilité (liste de travail du dashboard). */
  async refundsDue(): Promise<CardRequest[]> {
    return this.repo.listByStatus("refund_due")
  }

  /**
   * La comptabilité a crédité le client dans le CBS : elle saisit la référence
   * de l'écriture. Le montant à créditer est `request.pricing.totalDebitCents`
   * (recharge + frais : remboursement intégral). Principe des quatre yeux :
   * la personne qui confirme ne peut pas être celle qui a créé la demande.
   * Rejouer la même confirmation est sans effet.
   */
  async confirmRefund(id: string, input: { reference: string; confirmedBy: string }): Promise<CardRequest> {
    const request = await this.repo.get(id)
    if (!request) throw new Error(`Demande ${id} introuvable.`)
    const reference = input.reference.trim()
    if (!reference) throw new ValidationError("reference_required", "Référence de l'écriture CBS requise.")
    if (!input.confirmedBy) throw new ValidationError("confirmer_required", "Personne qui confirme requise.")

    if (request.status === "failed_refunded") {
      if (request.cbsRefundRef === reference) return request
      throw new ValidationError("already_refunded", `Déjà remboursée (réf. ${request.cbsRefundRef}).`)
    }
    if (request.status !== "refund_due") {
      throw new ValidationError("not_refundable", `Cette demande n'a pas de remboursement à confirmer (état : ${request.status}).`)
    }
    if (input.confirmedBy === request.createdBy) {
      throw new ValidationError("same_person", "La confirmation du remboursement doit venir d'une autre personne que l'auteur de la demande.")
    }
    return this.repo.save(
      this.transition(request, "failed_refunded", `Remboursement de ${request.pricing.totalDebitCents / 100} USD confirmé par ${input.confirmedBy} (réf. CBS ${reference}).`, {
        cbsRefundRef: reference,
      })
    )
  }

  // ---- Pas internes ---------------------------------------------------

  private async debitStep(request: CardRequest): Promise<CardRequest> {
    const working = this.bump(request, "debit")
    let result: CbsDebitResult
    try {
      result = await this.cbs.debit({
        requestId: request.id,
        accountNumber: request.accountNumber,
        amountCents: request.pricing.totalDebitCents, // recharge + frais
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
            this.transition(working, "refund_due", `Émission impossible après ${working.attempts.issue} essais : remboursement à faire par la comptabilité.`, {
              lastError: this.error("issue", result.code, result.message),
            })
          )
        }
        return this.repo.save(this.annotate(working, `Émission à réessayer (même clé) : ${result.message}`, this.error("issue", result.code, result.message)))
      case "permanent":
        return this.repo.save(
          this.transition(working, "refund_due", `Émission refusée : ${result.message}. Remboursement à faire.`, {
            lastError: this.error("issue", result.code, result.message),
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

  private bump(request: CardRequest, step: "debit" | "issue"): CardRequest {
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
