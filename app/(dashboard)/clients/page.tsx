import type { Metadata } from "next";
import { Building2, ShieldCheck, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatGrid } from "@/components/shared/stat-card";
import { NewClientButton } from "@/components/views/new-client-button";
import { ClientsView } from "@/components/views/clients-view";
import { clientStats } from "@/lib/data/clients";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Clients · Accès Finance",
};

export default function ClientsPage() {
  return (
    <ClientsView>
      <PageHeader
        title="Clients"
        breadcrumb={[{ label: "Clients" }]}
        actions={<NewClientButton />}
      />
      <StatGrid
        stats={[
          { label: "Total des clients", value: formatNumber(clientStats.total), icon: Users, tone: "info", caption: "Tous les clients enregistrés" },
          { label: "Particuliers", value: formatNumber(clientStats.individuals), icon: UserPlus, tone: "success", caption: `${((clientStats.individuals / clientStats.total) * 100).toFixed(1)}% de la clientèle` },
          { label: "Entreprises", value: formatNumber(clientStats.companies), icon: Building2, tone: "purple", caption: "Personnes morales" },
          { label: "KYC en attente", value: formatNumber(clientStats.kycPending), icon: ShieldCheck, tone: "warning", caption: "Dossiers à vérifier" },
        ]}
      />
    </ClientsView>
  );
}
