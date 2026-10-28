import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { RiskAlertsView } from "@/components/views/risk-alerts-view";

export const metadata: Metadata = {
  title: "Gestion des risques · Accès Finance",
};

export default function RisksPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Gestion des risques"
        breadcrumb={[{ label: "Gestion des risques" }, { label: "Alertes de fraude" }]}
      />
      <RiskAlertsView />
    </PageContainer>
  );
}
