import { NoFeeScheduleError } from "../domain/ports.ts"
import type { PricingPort } from "../domain/ports.ts"
import { DEFAULT_BOUNDS, PricingError, validateFeeSchedule } from "../domain/pricing.ts"
import type { PricingBounds } from "../domain/pricing.ts"
import type { FeeSchedule } from "../domain/types.ts"

// Grilles en mémoire. La version base de données gardera l'historique complet
// (jamais d'UPDATE d'une grille publiée : on en publie une nouvelle) et
// journalisera qui a publié quoi et quand.
export class MemoryPricing implements PricingPort {
  private schedules: FeeSchedule[] = []
  private bounds: PricingBounds

  constructor(bounds: PricingBounds = DEFAULT_BOUNDS) {
    this.bounds = bounds
  }

  publish(schedule: FeeSchedule): void {
    validateFeeSchedule(schedule, this.bounds)
    if (this.schedules.some((s) => s.id === schedule.id)) throw new PricingError("duplicate_id", "Identifiant de grille déjà utilisé.")
    this.schedules.push(structuredClone(schedule))
    this.schedules.sort((a, b) => Date.parse(a.effectiveFrom) - Date.parse(b.effectiveFrom))
  }

  list(): FeeSchedule[] {
    return structuredClone(this.schedules)
  }

  async getEffective(at: Date): Promise<FeeSchedule> {
    let current: FeeSchedule | undefined
    for (const s of this.schedules) if (Date.parse(s.effectiveFrom) <= at.getTime()) current = s
    if (!current) throw new NoFeeScheduleError()
    return structuredClone(current)
  }
}
