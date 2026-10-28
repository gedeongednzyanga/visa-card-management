import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CardRequestsView } from "@/components/views/card-requests-view";

export const metadata: Metadata = {
  title: "Demandes de carte · Accès Finance",
};

export default function CardRequestsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Demandes de carte"
        breadcrumb={[{ label: "Cartes virtuelles", href: "/cartes-virtuelles" }, { label: "Demande de carte" }]}
      />
      <CardRequestsView />
    </PageContainer>
  );
}
