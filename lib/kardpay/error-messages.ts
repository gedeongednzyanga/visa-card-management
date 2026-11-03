// Messages utilisateur pour les codes d'erreur KardPay les plus courants
// rencontrés par le dashboard (sections 5.1, 10.3, 10.7). Usage côté client
// uniquement — aucun secret ici, juste du texte.

const MESSAGES: Record<string, string> = {
  // Génériques (section 5.1)
  unauthorized: "Session expirée, merci de vous reconnecter.",
  forbidden: "Cette clé KardPay n'a pas les droits nécessaires pour cette action.",
  not_found: "Cette carte n'existe pas (ou plus) chez KardPay.",
  rate_limited: "Trop de requêtes envoyées à KardPay, réessayez dans un instant.",
  insufficient_escrow_balance: "Le solde de garantie (escrow) ne couvre pas cette opération.",
  gas_wallet_insufficient: "Le portefeuille de frais réseau est insuffisant.",
  // Émission (10.3)
  product_not_found: "Produit de carte introuvable pour ce compte KardPay.",
  product_unavailable: "Ce produit de carte est désactivé pour le moment.",
  external_ref_conflict: "Cette référence est déjà utilisée par une autre carte.",
  queue_full: "La file d'attente de financement est pleine, réessayez plus tard.",
  card_limit_reached: "Le nombre maximal de cartes actives a été atteint.",
  daily_issue_limit_reached: "Le plafond quotidien d'émission de cartes est atteint.",
  cards_per_email_reached: "Cet email détient déjà le nombre maximal de cartes autorisé.",
  phone_required: "Le numéro de téléphone du titulaire est requis pour ce produit.",
  invalid_phone: "Le numéro de téléphone n'est pas valide.",
  email_domain_not_allowed: "Ce domaine email n'est pas accepté par KardPay.",
  provider_rejected: "L'émetteur de la carte a refusé la demande.",
  pool_unavailable: "L'émetteur manque de capacité pour le moment, réessayez plus tard.",
  product_maintenance: "Ce produit est en maintenance, réessayez plus tard.",
  // Freeze / unfreeze (10.7)
  card_not_active: "Cette carte n'est pas active, elle ne peut pas être bloquée.",
  card_not_frozen: "Cette carte n'est pas bloquée, elle ne peut pas être débloquée.",
  status_change_cooldown: "Un changement de statut vient d'avoir lieu, merci d'attendre avant de réessayer.",
  CARD_BIN_MAINTENANCE: "Une fenêtre de maintenance est active sur cette carte, réessayez plus tard.",
  // Idempotence (6.3)
  idempotency_key_required: "Erreur technique interne (clé d'idempotence manquante).",
  idempotency_key_reused: "Cette action a déjà été lancée différemment, rechargez la page et réessayez.",
  idempotency_in_progress: "Cette action est déjà en cours de traitement, patientez quelques secondes.",
  // Transport / relais interne
  kardpay_unavailable: "Le service carte KardPay n'est pas encore connecté.",
  auth_unavailable: "Le service d'authentification est momentanément indisponible.",
  provider_unavailable: "L'émetteur de la carte est temporairement indisponible, réessayez.",
}

/** Code d'erreur KardPay (ou interne) -> message affichable à l'utilisateur. */
export function kardpayErrorMessage(code: string | undefined, fallback?: string): string {
  if (code && MESSAGES[code]) return MESSAGES[code]
  return fallback ?? "Une erreur inattendue est survenue."
}
