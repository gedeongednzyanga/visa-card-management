import Image from "next/image"
import logoIcon from "@/public/logos/logo-1.png"
import logoIconWhite from "@/public/logos/logo-1-white.png"
import logoFull from "@/public/logos/logo-2.png"
import logoFullWhite from "@/public/logos/logo-2-white.png"
import { cn } from "@/lib/utils"

export { logoIcon, logoIconWhite }

/**
 * - `inverse` : logo blanc, pour les fonds sombres (sidebar, panneau de connexion).
 * - `full` : logo couleur, pour les fonds clairs.
 */
export function BrandLogo({
  variant = "inverse",
  className,
  preload,
}: {
  variant?: "inverse" | "full"
  className?: string
  preload?: boolean
}) {
  return (
    <Image
      src={variant === "inverse" ? logoFullWhite : logoFull}
      alt="Accès Finance — Votre partenaire financier fiable"
      className={cn("h-10 w-auto", className)}
      preload={preload}
    />
  )
}
