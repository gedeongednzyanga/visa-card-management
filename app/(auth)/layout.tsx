import { CheckCircle2 } from "lucide-react";
import { VirtualCardVisual } from "@/components/cards/virtual-card-visual";
import { BrandLogo } from "@/components/brand-logo";
import { virtualCards } from "@/lib/cards-data";

const highlights = [
  "Émission de cartes Visa et Mastercard virtuelles en quelques minutes",
  "Plafonds, blocage et déblocage en temps réel",
  "Détection des fraudes et suivi des alertes",
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-32 -right-32 size-112 rounded-full bg-sidebar-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-104 rounded-full bg-sidebar-primary/10 blur-3xl" />

        <BrandLogo className="relative h-12 self-start" preload />

        <div className="relative my-auto max-w-md space-y-8 py-10">
          <div className="space-y-3">
            <h2 className="text-3xl leading-tight font-bold text-white">
              La gestion de vos cartes virtuelles, simple et sécurisée.
            </h2>
            <p className="text-sidebar-foreground/75">
              Une plateforme unique pour les équipes d&apos;Accès Finance : clients, comptes, cartes et risques.
            </p>
          </div>

          <VirtualCardVisual card={virtualCards[0]} className="max-w-sm -rotate-3 shadow-2xl" />

          <ul className="space-y-3 text-sm">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-foreground/60">
          © 2026 Accès Finance SA · Agrément BCC/IMF/0042
        </p>
      </aside>

      <main className="flex flex-col bg-card px-4 py-8 sm:px-10">
        <div className="mx-auto mb-10 w-full max-w-sm lg:hidden">
          <BrandLogo variant="full" preload />
        </div>
        <div className="mx-auto my-auto w-full max-w-sm">{children}</div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Accès réservé au personnel autorisé. Toute activité est journalisée.
        </p>
      </main>
    </div>
  );
}
