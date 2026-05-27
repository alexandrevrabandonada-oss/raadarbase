import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import type { TerritorySummary, TerritoryDetail } from "@/lib/types";
import { mapTerritoryToPhase } from "@/lib/data/territory-mapper";
import { listStrategicMemories } from "@/lib/data/strategic-memory";

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
  const [submissionsRes, volunteersRes, eventsRes] = await Promise.all([
    supabase.from("bairro_escuta_submissions").select("bairro, pauta, status"),
    supabase.from("campaign_volunteers").select("neighborhood, status"),
    supabase.from("field_agenda_events").select("neighborhood, starts_at, status, title, id"),
  ]);

  if (submissionsRes.error) throw submissionsRes.error;
  if (volunteersRes.error) throw volunteersRes.error;
  if (eventsRes.error) throw eventsRes.error;

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
  const phase = mapTerritoryToPhase(summary);

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
      aggregatedPeople: [
        {
          label: "Sinais monitorados",
          value: summary.peopleMonitored,
          description: "Pessoas ou relatos agregados que puxam leitura territorial.",
        },
        {
          label: "Prioridades abertas",
          value: summary.priorityPeople,
          description: "Contatos ou relatos que pedem resposta mais rápida.",
        },
        {
          label: "Voluntários locais",
          value: summary.volunteers,
          description: "Base já conectada ao território para ativação.",
        },
      ],
      recentMemory: [
        {
          id: "memory-vr-1",
          title: "Escuta sobre infraestrutura consolidada",
          summary: "Os relatos recentes concentram rua, iluminação e manutenção urbana como pauta de mobilização.",
          source: "Memória estratégica",
          occurredAt: "2026-04-22T12:00:00Z",
        },
        {
          id: "memory-vr-2",
          title: "Ação de praça gerou retorno",
          summary: "A banca de escuta presencial aumentou a disposição para mutirão local.",
          source: "Resultado de campo",
          occurredAt: "2026-04-10T18:00:00Z",
        },
      ],
      phaseWhy: phase.reason,
      nextActions: [
        phase.nextStep,
        "Revisar os temas mais quentes do bairro antes de abrir nova missão.",
        "Conectar memória recente ao próximo movimento de campo.",
      ],
    };
  }

  const supabase = getSupabaseAdminClient();
  const [eventsRes, submissionsRes, memories] = await Promise.all([
    supabase
      .from("field_agenda_events")
      .select("id, title, starts_at, status")
      .eq("neighborhood", bairro)
      .order("starts_at", { ascending: false })
      .limit(5),
    supabase
      .from("bairro_escuta_submissions")
      .select("id, pauta, relato_curto, created_at, status")
      .eq("bairro", bairro)
      .order("created_at", { ascending: false })
      .limit(8),
    listStrategicMemories({ territory: bairro }).then((items) => items.slice(0, 3)),
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (submissionsRes.error) throw submissionsRes.error;

  const events = eventsRes.data ?? [];
  const submissions = submissionsRes.data ?? [];

  // Logic for suggested action
  let suggestedAction = "Banca de Escuta";
  if (summary.priorityScore > 80 && summary.fieldActions === 0) {
    suggestedAction = "Ação de Campo Prioritária";
  } else if (summary.volunteers > 5) {
    suggestedAction = "Reunião de Núcleo";
  }

  const recentMemory = [
    ...memories.map((memory) => ({
      id: memory.id,
      title: memory.title,
      summary: memory.summary,
      source: memory.topic?.name ? `Memória: ${memory.topic.name}` : "Memória estratégica",
      occurredAt: memory.created_at,
    })),
    ...submissions.slice(0, 2).map((submission) => ({
      id: submission.id,
      title: `Escuta sobre ${submission.pauta}`,
      summary: submission.relato_curto,
      source: "Escuta territorial",
      occurredAt: submission.created_at,
    })),
  ].slice(0, 5);

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
    aggregatedPeople: [
      {
        label: "Sinais monitorados",
        value: summary.peopleMonitored,
        description: "Base agregada de relatos e escutas que puxam o bairro.",
      },
      {
        label: "Prioridades abertas",
        value: summary.priorityPeople,
        description: "Pessoas e relatos que pedem resposta de mobilização.",
      },
      {
        label: "Voluntários locais",
        value: summary.volunteers,
        description: "Capacidade já disponível para missão de campo ou continuidade.",
      },
    ],
    recentMemory,
    phaseWhy: phase.reason,
    nextActions: [
      phase.nextStep,
      suggestedAction ? `Transformar leitura em missão: ${suggestedAction}.` : "Definir a próxima missão territorial.",
      summary.topThemes[0] ? `Usar o tema "${summary.topThemes[0].theme}" como eixo de conversa no território.` : "Revisar o tema mais recorrente antes de seguir.",
    ],
  };
}
