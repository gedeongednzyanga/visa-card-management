import type { AppliedPricing, FeeSchedule } from "./types.ts"

// Bornes dures, indépendantes de la grille : aucune grille saisie dans le
// dashboard ne peut les dépasser, même par erreur de frappe.
export interface PricingBounds {
  /** Recharge minimale imposée par la banque (20 $). */
  minLoadCents: number
  /** Recharge maximale par top-up chez KardPay (5 000 $, relevable). */
  maxLoadCents: number
  /** Garde-fou sur les frais proportionnels (10 000 = 100 %). */
  maxPercentBp: number
}

export const DEFAULT_BOUNDS: PricingBounds = { minLoadCents: 2_000, maxLoadCents: 500_000, maxPercentBp: 2_000 }

export class PricingError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

const isCents = (n: number) => Number.isInteger(n) && n >= 0

/** Valide une grille avant publication. Lève PricingError au premier défaut. */
export function validateFeeSchedule(s: FeeSchedule, bounds: PricingBounds = DEFAULT_BOUNDS): void {
  if (!s.id) throw new PricingError("id_required", "Identifiant de grille requis.")
  if (!s.createdBy) throw new PricingError("author_required", "Auteur de la grille requis.")
  if (Number.isNaN(Date.parse(s.effectiveFrom))) throw new PricingError("invalid_date", "Date d'entrée en vigueur invalide.")
  for (const [name, value] of [
    ["issuanceFeeCents", s.issuanceFeeCents],
    ["loadFeeFixedCents", s.loadFeeFixedCents],
    ["minLoadCents", s.minLoadCents],
    ["maxLoadCents", s.maxLoadCents],
  ] as const) {
    if (!isCents(value)) throw new PricingError("invalid_amount", `${name} doit être un entier de centimes positif ou nul.`)
  }
  if (!Number.isInteger(s.loadFeePercentBp) || s.loadFeePercentBp < 0 || s.loadFeePercentBp > bounds.maxPercentBp) {
    throw new PricingError("invalid_percent", `Frais proportionnels : entre 0 et ${bounds.maxPercentBp / 100} %.`)
  }
  if (s.minLoadCents < bounds.minLoadCents) {
    throw new PricingError("min_below_bank", `Recharge minimale : ${bounds.minLoadCents / 100} USD au moins (limite banque).`)
  }
  if (s.maxLoadCents > bounds.maxLoadCents) {
    throw new PricingError("max_above_provider", `Recharge maximale : ${bounds.maxLoadCents / 100} USD au plus (limite KardPay actuelle).`)
  }
  if (s.minLoadCents > s.maxLoadCents) throw new PricingError("min_above_max", "Le minimum dépasse le maximum.")
}

/** Calcule les frais d'une recharge. Arrondi à l'entier le plus proche (0,5 vers le haut), en entiers uniquement. */
export function computeCharges(s: FeeSchedule, loadCents: number): AppliedPricing {
  const loadFeeCents = s.loadFeeFixedCents + Math.floor((loadCents * s.loadFeePercentBp + 5_000) / 10_000)
  const feeCents = s.issuanceFeeCents + loadFeeCents
  return {
    feeScheduleId: s.id,
    issuanceFeeCents: s.issuanceFeeCents,
    loadFeeCents,
    feeCents,
    totalDebitCents: loadCents + feeCents,
  }
}
