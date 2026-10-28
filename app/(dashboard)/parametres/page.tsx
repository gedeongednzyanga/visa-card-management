import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { SystemSettingsView } from "@/components/views/system-settings-view";

export const metadata: Metadata = {
  title: "Paramètres système · Accès Finance",
};

export default function SystemSettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Paramètres système"
        breadcrumb={[{ label: "Paramètres système" }, { label: "Utilisateurs et rôles" }]}
      />
      <SystemSettingsView />
    </PageContainer>
  );
}
