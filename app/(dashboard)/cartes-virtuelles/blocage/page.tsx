import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CardBlockingView } from "@/components/views/card-blocking-view";

export const metadata: Metadata = {
  title: "Blocage / Déblocage · Accès Finance",
};

export default function CardBlockingPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Blocage / Déblocage"
        breadcrumb={[{ label: "Cartes virtuelles", href: "/cartes-virtuelles" }, { label: "Blocage / Déblocage" }]}
      />
      <CardBlockingView />
    </PageContainer>
  );
}
