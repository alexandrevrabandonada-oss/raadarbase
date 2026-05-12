import * as React from "react";
import { Metadata } from "next";
import { listTerritorySummaries } from "@/lib/data/territories";
import { getTerritorialExpansionCandidates } from "@/lib/data/territorial-expansion";
import { TerritoriesClient } from "./territories-client";

export const metadata: Metadata = {
  title: "Painel Territorial | Radar de Base",
  description: "Planejamento e análise de mobilização por bairro e território.",
};

export default async function TerritoriesPage() {
  const [summaries, expansionData] = await Promise.all([
    listTerritorySummaries(),
    getTerritorialExpansionCandidates(),
  ]);

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-7xl">
      <TerritoriesClient initialSummaries={summaries} expansionData={expansionData} />
    </div>
  );
}
