import { test } from "node:test"
import assert from "node:assert/strict"
import { FakeCbs } from "../adapters/fake-cbs.ts"
import { FakeKardPay } from "../adapters/fake-kardpay.ts"
import { MemoryPricing } from "../adapters/memory-pricing.ts"
import { MemoryRepository } from "../adapters/memory-repository.ts"
import { CardOrchestrator, ValidationError } from "../domain/orchestrator.ts"
import { NoFeeScheduleError } from "../domain/ports.ts"
import { PricingError, computeCharges } from "../domain/pricing.ts"
import type { FeeSchedule } from "../domain/types.ts"

const ACCOUNT = "200200000002"

const schedule = (over: Partial<FeeSchedule> = {}): FeeSchedule => ({
  id: "g1",
  effectiveFrom: "2026-01-01T00:00:00Z",
  createdBy: "admin",
  issuanceFeeCents: 300, // 3,00 $
  loadFeeFixedCents: 50, // 0,50 $
  loadFeePercentBp: 150, // 1,5 %
  minLoadCents: 2_000,
  maxLoadCents: 500_000,
  ...over,
})

function setup(initial?: FeeSchedule) {
  const repo = new MemoryRepository()
  const cbs = new FakeCbs()
  const kardpay = new FakeKardPay()
  const pricing = new MemoryPricing()
  if (initial) pricing.publish(initial)
  const clock = { t: Date.parse("2026-11-04T10:00:00Z") }
  let n = 0
  const orch = new CardOrchestrator({ repo, cbs, kardpay, pricing, now: () => new Date(clock.t), newId: () => `req-${++n}` })
  cbs.setBalance(ACCOUNT, 100_000)
  let t = 0
  const submit = (amountCents: number) =>
    orch.submit({ clientToken: `tok-${++t}`, clientId: "200000002", accountNumber: ACCOUNT, amountCents, createdBy: "agent-1" })
  return { repo, cbs, kardpay, pricing, clock, orch, submit }
}

test("calcul : émission + fixe + pourcentage, en entiers", () => {
  const p = computeCharges(schedule(), 10_000)
  assert.equal(p.issuanceFeeCents, 300)
  assert.equal(p.loadFeeCents, 50 + 150) // 0,50 $ + 1,5 % de 100 $
  assert.equal(p.feeCents, 500)
  assert.equal(p.totalDebitCents, 10_500)
})

test("arrondi au centime le plus proche, 0,5 vers le haut", () => {
  // 1,5 % de 33,33 $ = 49,995 centimes -> 50
  assert.equal(computeCharges(schedule({ issuanceFeeCents: 0, loadFeeFixedCents: 0 }), 3_333).feeCents, 50)
  // 1,5 % de 33,32 $ = 49,98 centimes -> 50 ; 33,30 $ -> 49,95 -> 50 ; 33,00 $ -> 49,5 -> 50
  assert.equal(computeCharges(schedule({ issuanceFeeCents: 0, loadFeeFixedCents: 0 }), 3_300).feeCents, 50)
  // 1,5 % de 32,00 $ = 48 centimes pile
  assert.equal(computeCharges(schedule({ issuanceFeeCents: 0, loadFeeFixedCents: 0 }), 3_200).feeCents, 48)
})

test("grille sans frais : le total égale la recharge", () => {
  const p = computeCharges(schedule({ issuanceFeeCents: 0, loadFeeFixedCents: 0, loadFeePercentBp: 0 }), 5_000)
  assert.equal(p.feeCents, 0)
  assert.equal(p.totalDebitCents, 5_000)
})

test("le client est débité de la recharge + frais, la carte reçoit la recharge seule", async () => {
  const { orch, submit, cbs, kardpay } = setup(schedule())
  const r = await submit(10_000)
  assert.equal(r.pricing.totalDebitCents, 10_500)
  const done = await orch.run(r.id)
  assert.equal(done.status, "issued")
  assert.equal(cbs.balance(ACCOUNT), 100_000 - 10_500)
  assert.deepEqual(kardpay.issueAmounts, [10_000])
})

test("échec d'émission : remboursement intégral, frais compris", async () => {
  const { orch, submit, cbs, kardpay } = setup(schedule())
  kardpay.issueScript = ["permanent"]
  const done = await orch.run((await submit(10_000)).id)
  assert.equal(done.status, "failed_refunded")
  assert.equal(cbs.balance(ACCOUNT), 100_000)
})

test("solde insuffisant : les frais comptent dans le montant à couvrir", async () => {
  const { orch, submit, cbs } = setup(schedule())
  cbs.setBalance(ACCOUNT, 10_400) // couvre la recharge (10 000) mais pas recharge + frais (10 500)
  const done = await orch.run((await submit(10_000)).id)
  assert.equal(done.status, "rejected")
  assert.equal(done.lastError?.code, "insufficient_funds")
})

test("changer la grille ne touche pas les demandes déjà créées", async () => {
  const { orch, submit, pricing, clock, cbs } = setup(schedule())
  const old = await submit(10_000)
  clock.t += 60_000
  pricing.publish(schedule({ id: "g2", effectiveFrom: new Date(clock.t).toISOString(), issuanceFeeCents: 900 }))
  const fresh = await submit(10_000)
  assert.equal(old.pricing.feeScheduleId, "g1")
  assert.equal(fresh.pricing.feeScheduleId, "g2")
  const done = await orch.run(old.id)
  assert.equal(done.pricing.feeCents, 500) // l'ancienne demande garde ses frais d'origine
  assert.equal(cbs.balance(ACCOUNT), 100_000 - 10_500)
})

test("grille programmée : appliquée seulement à partir de sa date d'entrée en vigueur", async () => {
  const { submit, pricing, clock } = setup(schedule())
  pricing.publish(schedule({ id: "g2", effectiveFrom: "2026-11-04T12:00:00Z", issuanceFeeCents: 1_000 }))
  assert.equal((await submit(10_000)).pricing.feeScheduleId, "g1")
  clock.t = Date.parse("2026-11-04T12:00:00Z")
  assert.equal((await submit(10_000)).pricing.feeScheduleId, "g2")
})

test("les bornes de la grille s'appliquent, sans jamais dépasser les bornes dures", async () => {
  const { submit } = setup(schedule({ minLoadCents: 5_000, maxLoadCents: 10_000 }))
  await assert.rejects(submit(4_999), (e: unknown) => e instanceof ValidationError && e.code === "amount_too_low")
  await assert.rejects(submit(10_001), (e: unknown) => e instanceof ValidationError && e.code === "amount_too_high")
  assert.equal((await submit(5_000)).status, "requested")
  assert.equal((await submit(10_000)).status, "requested")
})

test("sans grille publiée, aucune émission : l'erreur est explicite", async () => {
  const { submit } = setup()
  await assert.rejects(submit(10_000), NoFeeScheduleError)
})

test("une grille invalide est refusée à la publication (erreur de saisie dans le dashboard)", () => {
  const { pricing } = setup()
  const code = (s: FeeSchedule) => {
    try {
      pricing.publish(s)
      return "publiée"
    } catch (e) {
      return e instanceof PricingError ? e.code : "autre"
    }
  }
  assert.equal(code(schedule({ minLoadCents: 1_999 })), "min_below_bank")
  assert.equal(code(schedule({ maxLoadCents: 500_001 })), "max_above_provider")
  assert.equal(code(schedule({ minLoadCents: 9_000, maxLoadCents: 8_000 })), "min_above_max")
  assert.equal(code(schedule({ loadFeePercentBp: 2_001 })), "invalid_percent")
  assert.equal(code(schedule({ loadFeePercentBp: -1 })), "invalid_percent")
  assert.equal(code(schedule({ issuanceFeeCents: -1 })), "invalid_amount")
  assert.equal(code(schedule({ loadFeeFixedCents: 1.5 })), "invalid_amount")
  assert.equal(code(schedule({ effectiveFrom: "pas une date" })), "invalid_date")
  assert.equal(code(schedule({ createdBy: "" })), "author_required")
  assert.equal(code(schedule()), "publiée")
  assert.equal(code(schedule()), "duplicate_id")
})
