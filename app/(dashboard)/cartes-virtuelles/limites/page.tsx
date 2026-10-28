import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CardLimitsView } from "@/components/views/card-limits-view";

export const metadata: Metadata = {
  title: "Limites et plafonds · Accès Finance",
};

export default function CardLimitsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Limites et plafonds"
        breadcrumb={[{ label: "Cartes virtuelles", href: "/cartes-virtuelles" }, { label: "Limites et plafonds" }]}
      />
      <CardLimitsView />
    </PageContainer>
  );
}
