import type { Metadata } from "next";
import { VirtualCardsView } from "@/components/cards/virtual-cards-view";

export const metadata: Metadata = {
  title: "Cartes virtuelles · Accès Finance",
};

export default function VirtualCardsPage() {
  return <VirtualCardsView />;
}
