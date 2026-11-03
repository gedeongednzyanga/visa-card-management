import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

// IMPORTANT : ce composant rend l'Input de Base UI, pas un <input> HTML brut.
// En mode contrôlé, Base UI ignore silencieusement un onChange classique et
// n'appelle que `onValueChange(value, eventDetails)` — voir
// node_modules/@base-ui/react/field/control/FieldControl.js. Typer ces props
// comme React.ComponentProps<"input"> masquait onValueChange : un onChange
// passé ici compile sans erreur mais ne fait jamais rien (le champ se remplit
// visuellement, l'état React ne se met jamais à jour). Toujours utiliser
// onValueChange pour un Input contrôlé dans cette app.
function Input({ className, type, ...props }: React.ComponentProps<typeof InputPrimitive>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
