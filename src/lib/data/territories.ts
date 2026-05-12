import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { TerritorySummary, TerritoryDetail } from "@/lib/types";

export async function listTerritorySummaries(): Promise<TerritorySummary[]> {
  if (shouldUseMockData()) {
    return [
      {
        neighborhood: "Vila Rica",
        peopleMonitored: 45,
        priorityPeople: 12,
        topThemes: [
          { theme: "infraestrutura", count: 15 },
          { theme: "saúde", count: 8 },
        ],
        referrals: 5,
        volunteers: 10,
        openTasks: 3,
        fieldActions: 4,
        lastActionAt: "2026-04-20T10:00:00Z",
        priorityScore: 85,
      },
      {
        neighborhood: "Amaral Peixoto",
        peopleMonitored: 32,
        priorityPeople: 8,
        topThemes: [
          { theme: "transporte", count: 12 },
          { theme: "segurança", count: 6 },
        ],
        referrals: 2,
        volunteers: 4,
        openTasks: 5,
        fieldActions: 2,
        lastActionAt: "2026-04-22T14:30:00Z",
        priorityScore: 72,
      },
      {
        neighborhood: "Retiro",
        peopleMonitored: 28,
        priorityPeople: 15,
        topThemes: [
          { theme: "educação", count: 10 },
          { theme: "lazer", count: 7 },
        ],
        referrals: 8,
        volunteers: 12,
        openTasks: 2,
        fieldActions: 1,
        lastActionAt: "2026-04-15T09:00:00Z",
        priorityScore: 94,
      },
    ];
  }

  const supabase = getSupabaseAdminClient();

  // Fetch all neighborhoods across key tables
  const [submissionsRes, volunteersRes, eventsRes, tasksRes] = await Promise.all([
    supabase.from("bairro_escuta_submissions").select("bairro, pauta, status"),
    supabase.from("campaign_volunteers").select("neighborhood, status"),
    supabase.from("field_agenda_events").select("neighborhood, starts_at, status, title, id"),
    supabase.from("outreach_tasks").select("id, person_id, column_key").is("completed_at", null),
  ]);

  if (submissionsRes.error) throw submissionsRes.error;
  if (volunteersRes.error) throw volunteersRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (tasksRes.error) throw tasksRes.error;

  const neighborhoods = new Set<string>();
  submissionsRes.data.forEach(s => neighborhoods.add(s.bairro));
  volunteersRes.data.forEach(v => v.neighborhood && neighborhoods.add(v.neighborhood));
  eventsRes.data.forEach(e => e.neighborhood && neighborhoods.add(e.neighborhood));

  const summaries: TerritorySummary[] = Array.from(neighborhoods).map(bairro => {
    const bSubmissions = submissionsRes.data.filter(s => s.bairro === bairro);
    const bVolunteers = volunteersRes.data.filter(v => v.neighborhood === bairro);
    const bEvents = eventsRes.data.filter(e => e.neighborhood === bairro);
    
    // Theme aggregation
    const themeCounts = new Map<string, number>();
    bSubmissions.forEach(s => {
      themeCounts.set(s.pauta, (themeCounts.get(s.pauta) ?? 0) + 1);
    });
    const topThemes = Array.from(themeCounts.entries())
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const lastAction = bEvents
      .filter(e => e.status === "done" || e.status === "scheduled")
      .sort((a, b) => new Date(b.starts_at || 0).getTime() - new Date(a.starts_at || 0).getTime())[0];

    // Priority Score Calculation (Simplified)
    // Signals (reports) + Volunteers - Pending Tasks - Time since last action
    const signalsScore = bSubmissions.length * 2;
    const volunteerScore = bVolunteers.length * 3;
    const recencyBonus = lastAction ? Math.max(0, 20 - (Date.now() - new Date(lastAction.starts_at!).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      neighborhood: bairro,
      peopleMonitored: bSubmissions.length, // Using reports as proxy for unique signals
      priorityPeople: bSubmissions.filter(s => s.status === "urgente" || s.status === "novo").length,
      topThemes,
      referrals: 0, // Need to link referrals to neighborhoods if possible
      volunteers: bVolunteers.filter(v => v.status === "ativo").length,
      openTasks: 0, // Need person-to-neighborhood mapping for accurate count
      fieldActions: bEvents.length,
      lastActionAt: lastAction?.starts_at ?? null,
      priorityScore: Math.min(100, Math.round(signalsScore + volunteerScore + recencyBonus)),
    };
  });

  return summaries.sort((a, b) => b.priorityScore - a.priorityScore);
}

export async function getTerritoryDetail(bairro: string): Promise<TerritoryDetail | null> {
  const summaries = await listTerritorySummaries();
  const summary = summaries.find(s => s.neighborhood === bairro);
  
  if (!summary) return null;

  if (shouldUseMockData()) {
    return {
      ...summary,
      recentEvents: [
        { id: "e1", title: "Banca de Escuta Praça Central", startsAt: "2026-04-10T14:00:00Z", status: "done" },
        { id: "e2", title: "Caminhada Vila Rica", startsAt: "2026-05-15T09:00:00Z", status: "scheduled" },
      ],
      suggestedAction: summary.openTasks > 5 ? "Mutirão de Abordagem" : "Banca de Escuta Temática",
      historicalThemes: [
        { theme: "infraestrutura", count: 25 },
        { theme: "saúde", count: 18 },
        { theme: "lazer", count: 12 },
      ],
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data: events, error } = await supabase
    .from("field_agenda_events")
    .select("id, title, starts_at, status")
    .eq("neighborhood", bairro)
    .order("starts_at", { ascending: false })
    .limit(5);

  if (error) throw error;

  // Logic for suggested action
  let suggestedAction = "Banca de Escuta";
  if (summary.priorityScore > 80 && summary.fieldActions === 0) {
    suggestedAction = "Ação de Campo Prioritária";
  } else if (summary.volunteers > 5) {
    suggestedAction = "Reunião de Núcleo";
  }

  return {
    ...summary,
    recentEvents: events.map(e => ({
      id: e.id,
      title: e.title,
      startsAt: e.starts_at,
      status: e.status,
    })),
    suggestedAction,
    historicalThemes: summary.topThemes, // Fallback to current top themes
  };
}
