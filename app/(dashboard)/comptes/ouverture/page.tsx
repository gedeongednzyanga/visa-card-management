import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { OpenAccountForm } from "@/components/views/open-account-form";

export const metadata: Metadata = {
  title: "Ouverture de compte · Accès Finance",
};

export default function OpenAccountPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Ouverture de compte"
        breadcrumb={[{ label: "Comptes", href: "/comptes" }, { label: "Ouverture de compte" }]}
      />
      <OpenAccountForm />
    </PageContainer>
  );
}
