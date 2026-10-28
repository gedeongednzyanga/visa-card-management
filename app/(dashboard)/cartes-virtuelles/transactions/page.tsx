import type { Metadata } from "next";
import { Ban, CreditCard, Receipt, Wallet } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { StatGrid } from "@/components/shared/stat-card";
import { CardTransactionsTable } from "@/components/views/transactions-tables";
import { cardTxStats } from "@/lib/data/operations";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Transactions cartes · Accès Finance",
};

export default function CardTransactionsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Transactions cartes"
        breadcrumb={[{ label: "Cartes virtuelles", href: "/cartes-virtuelles" }, { label: "Transactions cartes" }]}
      />
      <StatGrid
        stats={[
          { label: "Transactions (30 j)", value: formatNumber(cardTxStats.count), icon: Receipt, tone: "info", caption: "Paiements par carte virtuelle" },
          { label: "Volume (30 j)", value: `${formatNumber(cardTxStats.volumeUsd)} USD`, icon: Wallet, tone: "success", caption: "Montant total approuvé" },
          { label: "Panier moyen", value: `${cardTxStats.averageUsd} USD`, icon: CreditCard, tone: "purple", caption: "Par transaction" },
          { label: "Refusées", value: formatNumber(cardTxStats.declined), icon: Ban, tone: "danger", trend: `${((cardTxStats.declined / cardTxStats.count) * 100).toFixed(1)}%`, caption: "Solde, plafond ou carte bloquée" },
        ]}
      />
      <CardTransactionsTable />
    </PageContainer>
  );
}
