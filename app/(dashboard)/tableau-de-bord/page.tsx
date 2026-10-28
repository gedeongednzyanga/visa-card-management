import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUp,
  CreditCard,
  Landmark,
  ShieldAlert,
  UserPlus,
  Users,
  Wallet,
  Plus,
  ArrowLeftRight,
} from "lucide-react";
import { ActivityChart } from "@/components/charts/activity-chart";
import { StatusChart } from "@/components/cards/status-chart";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { SeverityPill, TransactionStatusPill } from "@/components/shared/pills";
import { StatGrid } from "@/components/shared/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardStats } from "@/lib/cards-data";
import { clientStats } from "@/lib/data/clients";
import {
  monthlyActivity,
  riskAlerts,
  transactions,
  transactionStats,
  transactionTypeLabels,
} from "@/lib/data/operations";
import { formatNumber, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tableau de bord · Accès Finance",
};

const shortcuts = [
  { label: "Nouveau client", href: "/clients", icon: UserPlus, className: "bg-blue-50 text-primary" },
  { label: "Ouvrir un compte", href: "/comptes/ouverture", icon: Landmark, className: "bg-emerald-50 text-emerald-600" },
  { label: "Émettre une carte", href: "/cartes-virtuelles/emission", icon: CreditCard, className: "bg-purple-50 text-purple-600" },
  { label: "Alertes de fraude", href: "/risques", icon: ShieldAlert, className: "bg-red-50 text-red-600" },
];

export default function DashboardPage() {
  const newAlerts = riskAlerts.filter((a) => a.status === "nouvelle").slice(0, 5);

  return (
    <PageContainer>
      <PageHeader
        title="Tableau de bord"
        breadcrumb={[{ label: "Tableau de bord" }]}
        actions={
          <Link href="/cartes-virtuelles/emission" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
            <Plus />
            Émettre une carte virtuelle
          </Link>
        }
      />

      <StatGrid
        stats={[
          {
            label: "Clients",
            value: formatNumber(clientStats.total),
            icon: Users,
            tone: "info",
            trend: (
              <span className="inline-flex items-center gap-0.5">
                <ArrowUp className="size-3.5" />+{clientStats.newThisMonth}
              </span>
            ),
            caption: "Nouveaux ce mois-ci",
          },
          {
            label: "Cartes actives",
            value: formatNumber(cardStats.active),
            icon: CreditCard,
            tone: "success",
            trend: `${cardStats.activeRate}%`,
            caption: `Sur ${formatNumber(cardStats.total)} cartes émises`,
          },
          {
            label: "Volume du jour",
            value: `${formatNumber(transactionStats.volumeUsd)} USD`,
            icon: Wallet,
            tone: "purple",
            caption: `${formatNumber(transactionStats.today)} transactions`,
          },
          {
            label: "Alertes à traiter",
            value: String(riskAlerts.filter((a) => a.status === "nouvelle" || a.status === "en-cours").length),
            icon: ShieldAlert,
            tone: "danger",
            caption: "Nouvelles ou en cours",
          },
        ]}
      />

      <div className="grid gap-4 2xl:grid-cols-[1.4fr_1fr]">
        <ActivityChart
          title="Volume des transactions"
          subtitle="(milliers USD, 6 derniers mois)"
          data={monthlyActivity}
          xKey="month"
          series={[{ key: "volume", label: "Volume (k USD)", color: "var(--chart-1)" }]}
        />
        <StatusChart />
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1.4fr_1fr]">
        <Card className="gap-3 shadow-xs ring-foreground/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dernières transactions</CardTitle>
            <CardAction>
              <Link href="/transactions" className="text-xs text-primary hover:underline">
                Voir tout
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {transactions.slice(0, 6).map((tx) => (
                <li key={tx.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ArrowLeftRight className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {tx.description} · <span className="text-muted-foreground">{tx.holder}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transactionTypeLabels[tx.type]} · {tx.date}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p
                      className={cn(
                        "text-[13px] font-medium tabular-nums",
                        tx.amount < 0 ? "text-red-600" : "text-emerald-600"
                      )}
                    >
                      {formatSigned(tx.amount, tx.currency)}
                    </p>
                    <TransactionStatusPill value={tx.status} className="text-[10.5px]" />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="gap-3 shadow-xs ring-foreground/5">
            <CardHeader>
              <CardTitle className="font-semibold">Accès rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {shortcuts.map(({ label, href, icon: Icon, className }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-lg border p-3 text-[13px] font-medium transition-colors hover:bg-muted"
                >
                  <span className={cn("flex size-9 items-center justify-center rounded-lg", className)}>
                    <Icon className="size-4.5" />
                  </span>
                  {label}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="gap-3 shadow-xs ring-foreground/5">
            <CardHeader>
              <CardTitle className="font-semibold">Nouvelles alertes</CardTitle>
              <CardAction>
                <Link href="/risques" className="text-xs text-primary hover:underline">
                  Voir tout
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {newAlerts.map((alert) => (
                  <li key={alert.id} className="flex items-center gap-3 text-[13px]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{alert.rule}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {alert.client} · {alert.target}
                      </p>
                    </div>
                    <SeverityPill value={alert.severity} className="text-[10.5px]" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
