import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { IssueCardForm } from "@/components/views/issue-card-form";

export const metadata: Metadata = {
  title: "Émission de carte · Accès Finance",
};

export default function IssueCardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Émission de carte"
        breadcrumb={[{ label: "Cartes virtuelles", href: "/cartes-virtuelles" }, { label: "Émission de carte" }]}
      />
      <IssueCardForm />
    </PageContainer>
  );
}
