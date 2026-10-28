import Link from "next/link"
import { ChevronRight } from "lucide-react"

export type Crumb = { label: string; href?: string }

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string
  description?: string
  breadcrumb: Crumb[]
  actions?: React.ReactNode
}) {
  const crumbs: Crumb[] = [{ label: "Accueil", href: "/tableau-de-bord" }, ...breadcrumb]

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <nav aria-label="Fil d'Ariane" className="mt-1">
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {crumbs.map((crumb, i) => {
              const last = i === crumbs.length - 1
              return (
                <li key={crumb.label} className="flex items-center gap-2">
                  {i > 0 && (
                    <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
                  )}
                  {last || !crumb.href ? (
                    <span aria-current={last ? "page" : undefined} className="text-muted-foreground">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link href={crumb.href} className="hover:underline">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="min-w-0 flex-1 space-y-4 p-4 sm:p-6">{children}</main>
}
