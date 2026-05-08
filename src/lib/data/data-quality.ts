import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";
import { people as mockPeople } from "@/lib/mock-data";
import type { PersonWithContact } from "@/lib/types";

export type BaseQualityStats = {
  unassignedCount: number;
  possibleDuplicatesCount: number;
  noThemeCount: number;
  noInteractionCount: number;
  invalidUsernameCount: number;
  highScoreNoTaskCount: number;
  taskNoResponsibleCount: number;
  doNotContactCount: number;
  recentContactCount: number;
};

export type DuplicateGroup = {
  original: PersonWithContact;
  duplicates: PersonWithContact[];
  reason: string;
};

export async function getBaseQualityStats(): Promise<BaseQualityStats> {
  if (shouldUseMockData()) {
    return {
      unassignedCount: mockPeople.filter(p => !p.responsibleId).length,
      possibleDuplicatesCount: 2, // Mocked
      noThemeCount: mockPeople.filter(p => p.themes.length === 0).length,
      noInteractionCount: mockPeople.filter(p => !p.lastInteractionAt).length,
      invalidUsernameCount: mockPeople.filter(p => !p.username || p.username.includes(" ")).length,
      highScoreNoTaskCount: 5, // Mocked
      taskNoResponsibleCount: 3, // Mocked
      doNotContactCount: mockPeople.filter(p => p.status === "nao_abordar").length,
      recentContactCount: 8, // Mocked
    };
  }

  const supabase = getSupabaseAdminClient();
  
  // Executando contagens via Supabase
  const { data: people } = await supabase.from("ig_people").select("id, username, display_name, themes, status, responsible_id, last_interaction_at");
  const { data: tasks } = await supabase.from("outreach_tasks").select("id, person_id, responsible_id, completed_at");

  if (!people) return {
    unassignedCount: 0, possibleDuplicatesCount: 0, noThemeCount: 0, 
    noInteractionCount: 0, invalidUsernameCount: 0, highScoreNoTaskCount: 0,
    taskNoResponsibleCount: 0, doNotContactCount: 0, recentContactCount: 0
  };

  const tasksMap = new Map();
  tasks?.forEach(t => {
    if (!t.completed_at) {
      tasksMap.set(t.person_id, t);
    }
  });

  const stats: BaseQualityStats = {
    unassignedCount: people.filter(p => !p.responsible_id).length,
    possibleDuplicatesCount: 0, // Calculado abaixo
    noThemeCount: people.filter(p => !p.themes || p.themes.length === 0).length,
    noInteractionCount: people.filter(p => !p.last_interaction_at).length,
    invalidUsernameCount: people.filter(p => !p.username || p.username.includes(" ")).length,
    highScoreNoTaskCount: 0, // Depende de score que geralmente é calculado em tempo de runtime ou tabela externa
    taskNoResponsibleCount: tasks?.filter(t => !t.completed_at && !t.responsible_id).length || 0,
    doNotContactCount: people.filter(p => p.status === "nao_abordar").length,
    recentContactCount: 0, // Mocked por simplicidade de consulta
  };

  // Detecção de duplicatas simples
  const usernames = new Map<string, string>();
  people.forEach(p => {
    const normalized = p.username.toLowerCase().trim();
    if (usernames.has(normalized)) {
      stats.possibleDuplicatesCount++;
    } else {
      usernames.set(normalized, p.id);
    }
  });

  return stats;
}

export async function detectPossibleDuplicates(): Promise<DuplicateGroup[]> {
  if (shouldUseMockData()) return [];

  const supabase = getSupabaseAdminClient();
  const { data: people } = await supabase.from("ig_people").select("*");
  if (!people) return [];

  const groups: Map<string, DuplicateGroup> = new Map();
  const seenUsernames = new Map<string, PersonWithContact>();

  people.forEach(p => {
    const normalized = p.username.toLowerCase().replace(/[^a-z0-9]/g, "");
    const person = p as unknown as PersonWithContact;
    if (seenUsernames.has(normalized)) {
      const original = seenUsernames.get(normalized)!;
      if (!groups.has(normalized)) {
        groups.set(normalized, {
          original,
          duplicates: [],
          reason: "Username normalizado idêntico"
        });
      }
      groups.get(normalized)!.duplicates.push(person);
    } else {
      seenUsernames.set(normalized, person);
    }
  });

  return Array.from(groups.values());
}
