import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { CardSettingsView } from "@/components/views/card-settings-view";

export const metadata: Metadata = {
  title: "Paramètres cartes · Accès Finance",
};

export default function CardSettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Paramètres cartes"
        breadcrumb={[{ label: "Cartes virtuelles", href: "/cartes-virtuelles" }, { label: "Paramètres cartes" }]}
      />
      <CardSettingsView />
    </PageContainer>
  );
}
