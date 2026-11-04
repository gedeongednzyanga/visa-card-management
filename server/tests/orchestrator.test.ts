import { test } from "node:test"
import assert from "node:assert/strict"
import { FakeCbs } from "../adapters/fake-cbs.ts"
import { FakeKardPay } from "../adapters/fake-kardpay.ts"
import { MemoryRepository } from "../adapters/memory-repository.ts"
import { CardOrchestrator, ValidationError } from "../domain/orchestrator.ts"
import { ConflictError } from "../domain/ports.ts"

const ACCOUNT = "200200000002"

function setup(config = {}) {
  const repo = new MemoryRepository()
  const cbs = new FakeCbs()
  const kardpay = new FakeKardPay()
  const clock = { t: Date.parse("2026-11-04T10:00:00Z") }
  let n = 0
  const orch = new CardOrchestrator({
    repo,
    cbs,
    kardpay,
    now: () => new Date(clock.t),
    newId: () => `req-${++n}`,
    config,
  })
  cbs.setBalance(ACCOUNT, 100_000) // 1 000,00 USD
  let tokens = 0
  const submit = (amountCents = 5_000) =>
    orch.submit({ clientToken: `tok-${++tokens}`, clientId: "200000002", accountNumber: ACCOUNT, amountCents, createdBy: "agent-1" })
  return { repo, cbs, kardpay, clock, orch, submit }
}

test("chemin nominal : débit puis émission, avec le même identifiant partout", async () => {
  const { orch, submit, cbs, kardpay } = setup()
  const r = await submit()
  const done = await orch.run(r.id)
  assert.equal(done.status, "issued")
  assert.equal(done.kardpayCardId, "card_1")
  assert.deepEqual([...cbs.debits.keys()], [r.id]) // requestId CBS = id de la demande
  assert.deepEqual(kardpay.issueCalls, [r.id]) // Idempotency-Key = id de la demande
  assert.equal(cbs.balance(ACCOUNT), 95_000)
  assert.deepEqual(done.history.map((h) => h.status), ["requested", "debited", "issued"])
})

test("même clientToken : une seule demande, un seul débit (double clic)", async () => {
  const { orch, cbs } = setup()
  const input = { clientToken: "tok-x", clientId: "200000002", accountNumber: ACCOUNT, amountCents: 5_000, createdBy: "agent-1" }
  const a = await orch.submit(input)
  const b = await orch.submit(input)
  assert.equal(a.id, b.id)
  await orch.run(a.id)
  await orch.run(b.id)
  assert.equal(cbs.debits.size, 1)
  assert.equal(cbs.balance(ACCOUNT), 95_000)
})

test("validation : minimum 20 $, maximum 5 000 $, entiers, compte valide — rien n'est enregistré", async () => {
  const { orch, repo } = setup()
  const base = { clientToken: "t", clientId: "c", accountNumber: ACCOUNT, createdBy: "a" }
  await assert.rejects(orch.submit({ ...base, clientToken: "t1", amountCents: 1_999 }), (e: unknown) => e instanceof ValidationError && e.code === "amount_too_low")
  await assert.rejects(orch.submit({ ...base, clientToken: "t2", amountCents: 500_001 }), (e: unknown) => e instanceof ValidationError && e.code === "amount_too_high")
  await assert.rejects(orch.submit({ ...base, clientToken: "t3", amountCents: 2_500.5 }), (e: unknown) => e instanceof ValidationError && e.code === "invalid_amount")
  await assert.rejects(orch.submit({ ...base, clientToken: "t4", amountCents: 5_000, accountNumber: "12" }), (e: unknown) => e instanceof ValidationError && e.code === "invalid_account")
  assert.equal((await repo.listActionable()).length, 0)
  // bornes incluses
  assert.equal((await orch.submit({ ...base, clientToken: "t5", amountCents: 2_000 })).status, "requested")
  assert.equal((await orch.submit({ ...base, clientToken: "t6", amountCents: 500_000 })).status, "requested")
})

test("solde insuffisant : refusée, KardPay jamais appelé", async () => {
  const { orch, submit, cbs, kardpay } = setup()
  cbs.setBalance(ACCOUNT, 1_000)
  const done = await orch.run((await submit()).id)
  assert.equal(done.status, "rejected")
  assert.equal(done.lastError?.code, "insufficient_funds")
  assert.equal(kardpay.issueCalls.length, 0)
})

test("compte refusé par le CBS : refusée, rien débité", async () => {
  const { orch, submit, cbs, kardpay } = setup()
  cbs.debitScript = ["rejected"]
  const done = await orch.run((await submit()).id)
  assert.equal(done.status, "rejected")
  assert.equal(cbs.balance(ACCOUNT), 100_000)
  assert.equal(kardpay.issueCalls.length, 0)
})

test("CBS indisponible (rien appliqué) : on réessaie puis on aboutit, un seul débit", async () => {
  const { orch, submit, cbs } = setup()
  cbs.debitScript = ["not_applied", "not_applied"]
  const r = await submit()
  let s = await orch.advance(r.id)
  assert.equal(s.status, "requested")
  s = await orch.advance(r.id)
  assert.equal(s.status, "requested")
  const done = await orch.run(r.id)
  assert.equal(done.status, "issued")
  assert.equal(done.attempts.debit, 3)
  assert.equal(cbs.debits.size, 1)
})

test("CBS indisponible trop longtemps : refusée, rien débité", async () => {
  const { orch, submit, cbs } = setup({ maxAttempts: 3 })
  cbs.debitScript = ["not_applied", "not_applied", "not_applied"]
  const r = await submit()
  await orch.advance(r.id)
  await orch.advance(r.id)
  const s = await orch.advance(r.id)
  assert.equal(s.status, "rejected")
  assert.equal(cbs.debits.size, 0)
})

test("réponse du débit perdue (appliqué mais inconnu) : needs_review, jamais de second débit", async () => {
  const { orch, submit, cbs, kardpay } = setup()
  cbs.debitScript = ["lost_response"]
  const r = await submit()
  const s = await orch.advance(r.id)
  assert.equal(s.status, "needs_review")
  assert.equal(kardpay.issueCalls.length, 0)
  await orch.advance(r.id) // état terminal : rien ne se passe
  await orch.tick()
  assert.equal(cbs.debitCalls, 1)
  assert.equal(cbs.balance(ACCOUNT), 95_000)
})

test("reprise après crash entre débit CBS et sauvegarde : le doublon envoie en revue, sans redébiter", async () => {
  const { orch, submit, cbs } = setup()
  const r = await submit()
  // Un processus précédent a débité le CBS puis est mort avant de sauvegarder.
  await cbs.debit({ requestId: r.id, accountNumber: ACCOUNT, amountCents: 5_000, currency: "USD", description: "x" })
  const s = await orch.advance(r.id)
  assert.equal(s.status, "needs_review")
  assert.equal(s.lastError?.code, "duplicate")
  assert.equal(cbs.balance(ACCOUNT), 95_000)
})

test("KardPay réessayable : même Idempotency-Key à chaque essai, une seule carte", async () => {
  const { orch, submit, kardpay } = setup()
  kardpay.issueScript = ["retryable", "throw"]
  const r = await submit()
  const done = await orch.run(r.id)
  assert.equal(done.status, 'debited') // run s'arrête quand l'état ne change plus
  await orch.advance(r.id)
  const final = await orch.advance(r.id)
  assert.equal(final.status, "issued")
  assert.deepEqual(kardpay.issueCalls, [r.id, r.id, r.id])
  assert.equal(kardpay.cards.size, 1)
})

test("KardPay réessayable trop longtemps : remboursement", async () => {
  const { orch, submit, kardpay, cbs } = setup({ maxAttempts: 2 })
  kardpay.issueScript = ["retryable", "retryable"]
  const r = await submit()
  await orch.advance(r.id) // débit
  await orch.advance(r.id) // émission 1
  const s = await orch.advance(r.id) // émission 2 : épuisé
  assert.equal(s.status, "refund_pending")
  const done = await orch.run(r.id)
  assert.equal(done.status, "failed_refunded")
  assert.equal(cbs.balance(ACCOUNT), 100_000)
})

test("KardPay refuse définitivement : remboursement du client avec un requestId distinct", async () => {
  const { orch, submit, kardpay, cbs } = setup()
  kardpay.issueScript = ["permanent"]
  const r = await submit()
  const done = await orch.run(r.id)
  assert.equal(done.status, "failed_refunded")
  assert.equal(cbs.balance(ACCOUNT), 100_000)
  assert.deepEqual([...cbs.refunds.keys()], [`${r.id}-refund`])
  assert.ok(done.cbsRefundRef)
})

test("réponse du remboursement perdue : needs_review, pas de second remboursement", async () => {
  const { orch, submit, kardpay, cbs } = setup()
  kardpay.issueScript = ["permanent"]
  cbs.refundScript = ["lost_response"]
  const r = await submit()
  const done = await orch.run(r.id)
  assert.equal(done.status, "needs_review")
  await orch.tick()
  assert.equal(cbs.refundCalls, 1)
  assert.equal(cbs.balance(ACCOUNT), 100_000) // remboursé une seule fois, pas deux
})

test("remboursement CBS indisponible trop longtemps : needs_review, le client reste débité", async () => {
  const { orch, submit, kardpay, cbs } = setup({ maxAttempts: 2 })
  kardpay.issueScript = ["permanent"]
  cbs.refundScript = ["not_applied", "not_applied"]
  const r = await submit()
  await orch.advance(r.id)
  await orch.advance(r.id)
  await orch.advance(r.id)
  const s = await orch.advance(r.id)
  assert.equal(s.status, "needs_review")
  assert.equal(cbs.balance(ACCOUNT), 95_000)
})

test("émission acceptée (202) : attente, puis webhook card_issued ; rejeu du même événement ignoré", async () => {
  const { orch, submit, kardpay } = setup()
  kardpay.issueScript = ["accepted"]
  const r = await submit()
  const waiting = await orch.run(r.id)
  assert.equal(waiting.status, "awaiting_issuer")
  assert.equal(waiting.kardpayCardId, "card_1")

  const event = { eventId: "evt-1", kind: "card_issued" as const, cardId: "card_1" }
  assert.equal(await orch.handleWebhook(event), "processed")
  assert.equal(await orch.handleWebhook(event), "duplicate")
  const after = await orch.advance(r.id)
  assert.equal(after.status, "issued")
  assert.equal(after.history.filter((h) => h.status === "issued").length, 1)
})

test("webhook card_failed : remboursement déclenché par le worker", async () => {
  const { orch, submit, kardpay, cbs } = setup()
  kardpay.issueScript = ["accepted"]
  const r = await submit()
  await orch.run(r.id)
  assert.equal(await orch.handleWebhook({ eventId: "evt-2", kind: "card_failed", cardId: "card_1" }), "processed")
  await orch.tick()
  const done = await orch.advance(r.id)
  assert.equal(done.status, "failed_refunded")
  assert.equal(cbs.balance(ACCOUNT), 100_000)
})

test("webhook card_issued reçu après un remboursement : alerte needs_review (perte possible)", async () => {
  const { orch, submit, kardpay } = setup()
  kardpay.issueScript = ["accepted"]
  const r = await submit()
  await orch.run(r.id)
  await orch.handleWebhook({ eventId: "evt-3", kind: "card_failed", cardId: "card_1" })
  await orch.run(r.id)
  await orch.handleWebhook({ eventId: "evt-4", kind: "card_issued", cardId: "card_1" })
  const s = await orch.advance(r.id)
  assert.equal(s.status, "needs_review")
  assert.equal(s.lastError?.code, "issued_after_refund")
})

test("webhook non rattachable : 'unmatched' et NON marqué comme vu (redélivrance possible)", async () => {
  const { orch, repo } = setup()
  assert.equal(await orch.handleWebhook({ eventId: "evt-9", kind: "card_issued", cardId: "inconnue" }), "unmatched")
  assert.equal(await repo.markEventSeen("evt-9"), true)
})

test("pas de confirmation KardPay dans le délai : needs_review", async () => {
  const { orch, submit, kardpay, clock } = setup({ issuerTimeoutMs: 60_000 })
  kardpay.issueScript = ["accepted"]
  const r = await submit()
  await orch.run(r.id)
  clock.t += 30_000
  assert.equal((await orch.advance(r.id)).status, "awaiting_issuer")
  clock.t += 31_000
  assert.equal((await orch.advance(r.id)).status, "needs_review")
})

test("deux avancées simultanées sur la même demande : un seul débit, le perdant reçoit un conflit", async () => {
  const { orch, submit, cbs } = setup()
  const r = await submit()
  const results = await Promise.allSettled([orch.advance(r.id), orch.advance(r.id)])
  assert.equal(cbs.debits.size, 1)
  assert.equal(cbs.balance(ACCOUNT), 95_000)
  const rejected = results.filter((x) => x.status === "rejected")
  assert.equal(rejected.length, 1)
  assert.ok((rejected[0] as PromiseRejectedResult).reason instanceof ConflictError)
})

test("tick : fait avancer toutes les demandes en cours et ignore les terminées", async () => {
  const { orch, submit } = setup()
  const a = await submit()
  const b = await submit()
  await orch.run(a.id)
  const stats = await orch.tick()
  assert.equal(stats.advanced, 1) // seule b est encore active
  assert.equal((await orch.advance(b.id)).status, "issued")
})
