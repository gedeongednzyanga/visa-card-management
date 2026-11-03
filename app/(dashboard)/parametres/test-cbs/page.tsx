import type { Metadata } from "next"
import { PageContainer, PageHeader } from "@/components/shared/page-header"
import { CbsTestView } from "@/components/views/cbs-test-view"

export const metadata: Metadata = {
  title: "Test CBS BankSoft · Accès Finance",
}

export default function CbsTestPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Test CBS BankSoft"
        breadcrumb={[{ label: "Paramètres système", href: "/parametres" }, { label: "Test CBS BankSoft" }]}
      />
      <CbsTestView />
    </PageContainer>
  )
}
