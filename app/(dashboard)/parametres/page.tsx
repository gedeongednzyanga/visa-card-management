import { Suspense } from "react";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { SystemSettingsView } from "@/components/views/system-settings-view";
import { ApiError } from "@/lib/api";
import { getUsers } from "@/lib/users";

export const metadata: Metadata = {
  title: "Paramètres système · Accès Finance",
};

async function SystemSettings() {
  let users;
  try {
    users = await getUsers();
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
        Impossible de charger les utilisateurs : {e.message}
      </p>
    );
  }
  return <SystemSettingsView initialUsers={users} />;
}

export default function SystemSettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Paramètres système"
        breadcrumb={[{ label: "Paramètres système" }, { label: "Utilisateurs et rôles" }]}
      />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
        <SystemSettings />
      </Suspense>
    </PageContainer>
  );
}
