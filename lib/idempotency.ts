// Génération de clés d'idempotence pour les appels qui créent ou modifient
// une carte (émission, freeze, unfreeze, close...), voir la doc KardPay
// section 6.
//
// Règle de la doc (6.4) : "Create the key before the first attempt [...] so
// a restarted process reuses it. [...] Never reuse a key for a different
// action." Concrètement ici : on génère UNE clé au moment où l'utilisateur
// déclenche l'action (pas à chaque tentative HTTP), on la garde en mémoire
// pour toute la durée de cette action (retries compris), et on en jette une
// nouvelle à la prochaine action distincte.
//
// `crypto.randomUUID()` existe aussi bien côté navigateur (Web Crypto) que
// côté Node (globalThis.crypto depuis Node 19+), donc ce fichier n'a pas
// besoin d'être server-only.
export function createIdempotencyKey(): string {
  return crypto.randomUUID()
}
