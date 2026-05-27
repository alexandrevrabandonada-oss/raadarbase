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
  consentedContactCount: number;
  consentedVolunteerCount: number;
  eligibleForReviewCount: number;
  pendingFeedbackCount: number;
};

export type DuplicateGroup = {
  original: PersonWithContact;
  duplicates: PersonWithContact[];
  reason: string;
};

export async function countPeopleEligibleForReview(): Promise<number> {
  if (shouldUseMockData()) {
    return 15;
  }

  const supabase = getSupabaseAdminClient();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { count, error } = await supabase
    .from("ig_people")
    .select("*", { count: "exact", head: true })
    .not("last_interaction_at", "is", null)
    .lt("last_interaction_at", sixMonthsAgo.toISOString());

  if (error) throw error;
  return count ?? 0;
}

export async function getBaseQualityStats(): Promise<BaseQualityStats> {
  if (shouldUseMockData()) {
    return {
      unassignedCount: mockPeople.filter(p => !p.responsibleId).length,
      possibleDuplicatesCount: 2, // Mocked
      noThemeCount: mockPeople.filter(p => p.themes.length === 0).length,
      noInteractionCount: mockPeople.filter(p => !p.lastInteractionAt).length,
      invalidUsernameCount: mockPeople.filter(p => !p.username || p.username.includes(" ")).length,
      highScoreNoTaskCount: 5,
      taskNoResponsibleCount: 3,
      doNotContactCount: mockPeople.filter(p => p.status === "nao_abordar").length,
      recentContactCount: 8,
      consentedContactCount: 45,
      consentedVolunteerCount: 22,
      eligibleForReviewCount: 15,
      pendingFeedbackCount: 2,
    };
  }

  const supabase = getSupabaseAdminClient();
  
  const [
    { data: people },
    { data: tasks },
    { count: contactsCount },
    { count: volunteersCount },
    { count: incidentsCount },
  ] = await Promise.all([
    supabase.from("ig_people").select("id, username, display_name, themes, status, responsible_id, last_interaction_at"),
    supabase.from("outreach_tasks").select("id, person_id, responsible_id, completed_at"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("consent_status", "confirmed"),
    supabase.from("campaign_volunteers").select("*", { count: "exact", head: true }).eq("status", "ativo"),
    supabase.from("operational_incidents").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);

  if (!people) return {
    unassignedCount: 0, possibleDuplicatesCount: 0, noThemeCount: 0, 
    noInteractionCount: 0, invalidUsernameCount: 0, highScoreNoTaskCount: 0,
    taskNoResponsibleCount: 0, doNotContactCount: 0, recentContactCount: 0,
    consentedContactCount: 0, consentedVolunteerCount: 0, eligibleForReviewCount: 0,
    pendingFeedbackCount: 0
  };

  const tasksMap = new Map();
  tasks?.forEach(t => {
    if (!t.completed_at) {
      tasksMap.set(t.person_id, t);
    }
  });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const stats: BaseQualityStats = {
    unassignedCount: people.filter(p => !p.responsible_id).length,
    possibleDuplicatesCount: 0, // Calculado abaixo
    noThemeCount: people.filter(p => !p.themes || p.themes.length === 0).length,
    noInteractionCount: people.filter(p => !p.last_interaction_at).length,
    invalidUsernameCount: people.filter(p => !p.username || p.username.includes(" ")).length,
    highScoreNoTaskCount: 0,
    taskNoResponsibleCount: tasks?.filter(t => !t.completed_at && !t.responsible_id).length || 0,
    doNotContactCount: people.filter(p => p.status === "nao_abordar").length,
    recentContactCount: 0,
    consentedContactCount: contactsCount || 0,
    consentedVolunteerCount: volunteersCount || 0,
    eligibleForReviewCount: people.filter(p => p.last_interaction_at && new Date(p.last_interaction_at) < sixMonthsAgo).length,
    pendingFeedbackCount: incidentsCount || 0,
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

export async function suggestThemeForPerson(personId: string): Promise<string[]> {
  if (shouldUseMockData()) return ["educação", "saúde"]; // Mock simples

  const supabase = getSupabaseAdminClient();
  
  // Buscar temas citados em interações dessa pessoa
  const { data: interactions } = await supabase
    .from("ig_interactions")
    .select("theme")
    .eq("person_id", personId)
    .not("theme", "is", null);
  
  if (!interactions || interactions.length === 0) return [];

  const counts = new Map<string, number>();
  interactions.forEach(i => {
    if (i.theme) {
      counts.set(i.theme, (counts.get(i.theme) ?? 0) + 1);
    }
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0]);
}
