import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, Plus, Snowflake, TrendingUp, Wallet } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { StatGrid } from "@/components/shared/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { AccountsTable } from "@/components/views/accounts-table";
import { accountStats } from "@/lib/data/clients";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Comptes · Accès Finance",
};

export default function AccountsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Comptes"
        breadcrumb={[{ label: "Comptes", href: "/comptes" }, { label: "Tous les comptes" }]}
        actions={
          <Link href="/comptes/ouverture" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
            <Plus />
            Ouvrir un compte
          </Link>
        }
      />
      <StatGrid
        stats={[
          { label: "Total des comptes", value: formatNumber(accountStats.total), icon: Landmark, tone: "info", caption: "Comptes ouverts" },
          { label: "Encours USD", value: `${formatNumber(accountStats.balanceUsd)} USD`, icon: Wallet, tone: "success", caption: "Solde cumulé en USD" },
          { label: "Ouverts ce mois", value: formatNumber(accountStats.openedThisMonth), icon: TrendingUp, tone: "purple", trend: "+9.4%", caption: "Par rapport au mois dernier" },
          { label: "Comptes gelés", value: formatNumber(accountStats.frozen), icon: Snowflake, tone: "warning", caption: "En attente de régularisation" },
        ]}
      />
      <AccountsTable />
    </PageContainer>
  );
}
