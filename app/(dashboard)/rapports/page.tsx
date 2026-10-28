import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { ReportsView } from "@/components/views/reports-view";

export const metadata: Metadata = {
  title: "Rapports · Accès Finance",
};

export default function ReportsPage() {
  return (
    <PageContainer>
      <PageHeader title="Rapports" breadcrumb={[{ label: "Rapports" }]} />
      <ReportsView />
    </PageContainer>
  );
}
