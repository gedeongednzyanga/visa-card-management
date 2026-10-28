import type { Metadata } from "next";
import { AlertTriangle, ArrowLeftRight, Clock, Wallet } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { StatGrid } from "@/components/shared/stat-card";
import { TransactionsTable } from "@/components/views/transactions-tables";
import { transactionStats } from "@/lib/data/operations";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Transactions · Accès Finance",
};

export default function TransactionsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Transactions"
        breadcrumb={[{ label: "Transactions" }, { label: "Toutes les transactions" }]}
      />
      <StatGrid
        stats={[
          { label: "Transactions du jour", value: formatNumber(transactionStats.today), icon: ArrowLeftRight, tone: "info", caption: "Tous canaux confondus" },
          { label: "Volume du jour", value: `${formatNumber(transactionStats.volumeUsd)} USD`, icon: Wallet, tone: "success", caption: "Équivalent USD" },
          { label: "En attente", value: formatNumber(transactionStats.pending), icon: Clock, tone: "warning", caption: "En cours de traitement" },
          { label: "Taux d'échec", value: `${transactionStats.failedRate}%`, icon: AlertTriangle, tone: "danger", caption: "Sur les 24 dernières heures" },
        ]}
      />
      <TransactionsTable />
    </PageContainer>
  );
}
