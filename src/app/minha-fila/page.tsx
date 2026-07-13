import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { listOutreachTasks } from "@/lib/data/outreach";
import { buildQueueMissionPlan, orderQueueByMissionPlan } from "@/lib/missions/queue-mission-adapter";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { QueueClient } from "./queue-client";
import { Metadata } from "next";
import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOutreachGoalStats } from "@/lib/data/outreach-goal";
import { getActiveOperators } from "../abordagem/team-actions";
import { PeopleClient } from "../pessoas/people-client";
import { isPriorityPersonAlreadySent } from "@/lib/outreach-status";
import type { AuditLogEntry, InteractionWithPost, PersonReferral } from "@/lib/types";

import { listMessageTemplates } from "@/lib/data/messages";

export const metadata: Metadata = {
  title: "Prioridades da Equipe | Modo Operador",
  description: "Trabalhe nas missões ativas da base organizadas por urgência, dono e próximo passo.",
};

export const dynamic = "force-dynamic";

// A trilha detalhada exige histórico, encaminhamentos e auditoria por pessoa.
// Limitamos esse enriquecimento ao bloco que pode ser alcançado na rodada atual;
// o restante preserva a ordenação de prioridade já calculada na consulta principal.
const MISSION_PLAN_ANALYSIS_LIMIT = 100;

interface PageProps {
  searchParams: Promise<{ rodada?: string }>;
}

export default async function MinhaFilaPage({ searchParams }: PageProps) {
  const session = await requireInternalPageSession("/minha-fila");
  const resolvedParams = await searchParams;
  const isFocusMode = resolvedParams?.rodada === "foco";

  if (isFocusMode) {
    let priorityPeople;
    let outreachTasks;
    let templates = [];
    const dailyStats = {
      mySentCount: 0,
      othersSentCount: 0,
      goal: 15,
    };

    try {
      const isMock = shouldUseMockData();
      const [priorityPeopleRes, outreachTasksRes, todayLogsRes, templatesRes] = await Promise.all([
        isMock
          ? listPriorityPeople()
          : listPriorityPeople({ responsibleId: session.internalUser.id, limit: 1000 }),
        isMock
          ? listOutreachTasks()
          : listOutreachTasks({ responsibleId: session.internalUser.id }),
        isMock
          ? Promise.resolve({ data: null })
          : getSupabaseAdminClient()
              .from("audit_logs")
              .select("actor_id, actor_email")
              .eq("action", "contact.dm_sent")
              .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        listMessageTemplates(),
      ]);

      priorityPeople = priorityPeopleRes;
      outreachTasks = outreachTasksRes;
      templates = (templatesRes || []).filter((t) => t.active);

      if (isMock) {
        dailyStats.mySentCount = 5;
        dailyStats.othersSentCount = 12;
      } else if (todayLogsRes && todayLogsRes.data) {
        const myId = session.internalUser.id;
        const myEmail = session.email;
        todayLogsRes.data.forEach((log: { actor_id: string | null; actor_email: string | null }) => {
          if (log.actor_id === myId || log.actor_email === myEmail) {
            dailyStats.mySentCount++;
          } else {
            dailyStats.othersSentCount++;
          }
        });
      }
    } catch (error) {
      return (
        <AppShell>
          <PageHeader title="Minha Jornada" description="Trabalhe uma missão por vez, com ritmo claro." />
          <RuntimeAlert
            title="Erro ao carregar fila"
            description={error instanceof Error ? error.message : "Não foi possível carregar suas tarefas prioritárias."}
          />
        </AppShell>
      );
    }

    // Filtrar pela fila do operador logado. Em modo demonstração/mock, inclui também pessoas sem responsável atribuído.
    const myQueue = shouldUseMockData()
      ? (priorityPeople || []).filter(person => !person.responsibleId || person.responsibleId === "e2e-internal-user")
      : (priorityPeople || []);

    // Filtrar pessoas que ainda faltam mandar mensagens
    const filteredQueue = myQueue.filter(person => {
      // 1. Excluir quem tem restrição ética ou está marcado para não abordar
      if (person.status === "nao_abordar" || person.doNotContactReason) return false;
      
      // 2. Excluir quem já confirmou contato ou concluiu o ciclo (contato_confirmado)
      if (person.status === "contato_confirmado") return false;
      
      // 3. Excluir quem já possui encaminhamento (hasReferral)
      if (person.hasReferral) return false;
      
      return true;
    });

    const oldPendencies = filteredQueue.filter(isPriorityPersonAlreadySent);
    const activeQueue = filteredQueue.filter((person) => !isPriorityPersonAlreadySent(person));

    let missionPlan = null;
    let orderedActiveQueue = activeQueue;

    try {
      const taskMap = new Map<string, typeof outreachTasks>();
      for (const task of outreachTasks || []) {
        const existing = taskMap.get(task.personId) || [];
        existing.push(task);
        taskMap.set(task.personId, existing);
      }

      const missionPeople = activeQueue.slice(0, MISSION_PLAN_ANALYSIS_LIMIT);
      const missionPersonIds = missionPeople.map((person) => person.id);
      const supabase = getSupabaseAdminClient();
      const [interactionsResult, referralsResult, auditLogsResult] = await Promise.all([
        supabase
          .from("ig_interactions")
          .select("id, person_id, post_id, type, occurred_at, text_content, theme")
          .in("person_id", missionPersonIds)
          .order("occurred_at", { ascending: false }),
        supabase
          .from("ig_person_referrals")
          .select("*")
          .in("person_id", missionPersonIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("audit_logs")
          .select("*")
          .eq("entity_type", "ig_people")
          .in("entity_id", missionPersonIds)
          .order("created_at", { ascending: false }),
      ]);

      if (interactionsResult.error) throw interactionsResult.error;
      if (referralsResult.error) throw referralsResult.error;
      if (auditLogsResult.error) throw auditLogsResult.error;

      const interactionsByPerson = new Map<string, InteractionWithPost[]>();
      for (const row of interactionsResult.data ?? []) {
        const entries = interactionsByPerson.get(row.person_id) ?? [];
        entries.push({
          id: row.id,
          personId: row.person_id,
          postId: row.post_id,
          type: row.type,
          occurredAt: row.occurred_at,
          text: row.text_content ?? "",
          theme: row.theme,
          post: null,
        });
        interactionsByPerson.set(row.person_id, entries);
      }

      const referralsByPerson = new Map<string, PersonReferral[]>();
      for (const row of referralsResult.data ?? []) {
        const entries = referralsByPerson.get(row.person_id) ?? [];
        entries.push({
          id: row.id,
          personId: row.person_id,
          targetType: row.target_type,
          targetId: row.target_id,
          status: row.status,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          responsibleId: row.responsible_id,
          externalId: row.external_id,
          lastEventAt: row.last_event_at,
          lastEventType: row.last_event_type,
          lastEventSource: row.last_event_source === "manual" || row.last_event_source === "webhook" ? row.last_event_source : null,
          metadata: row.metadata,
        });
        referralsByPerson.set(row.person_id, entries);
      }

      const auditLogsByPerson = new Map<string, AuditLogEntry[]>();
      for (const row of auditLogsResult.data ?? []) {
        if (!row.entity_id) continue;
        const entries = auditLogsByPerson.get(row.entity_id) ?? [];
        if (entries.length >= 12) continue;
        entries.push({
          id: row.id,
          actorId: row.actor_id,
          actorEmail: row.actor_email,
          action: row.action,
          entityType: row.entity_type,
          entityId: row.entity_id,
          summary: row.summary,
          metadata: row.metadata,
          createdAt: row.created_at,
        });
        auditLogsByPerson.set(row.entity_id, entries);
      }

      const missionSources = missionPeople.map((person) => ({
        person,
        interactions: interactionsByPerson.get(person.id) ?? [],
        tasks: taskMap.get(person.id) || [],
        referrals: referralsByPerson.get(person.id) ?? [],
        auditLogs: auditLogsByPerson.get(person.id) ?? [],
      }));

      missionPlan = buildQueueMissionPlan(missionSources);
      orderedActiveQueue = orderQueueByMissionPlan(activeQueue, missionPlan);
    } catch {
      missionPlan = null;
      orderedActiveQueue = activeQueue;
    }

    return (
      <AppShell>
        <PageHeader 
          compact
          eyebrow="Modo Operador"
          title="Minha Jornada" 
          description="Uma pessoa por vez: preparar, enviar manualmente no Instagram e voltar para avançar automaticamente."
        />
        
        <QueueClient 
          initialQueue={orderedActiveQueue}
          oldPendencies={oldPendencies}
          missionPlan={missionPlan}
          operatorName={session.internalUser.full_name || session.email || "Operador"} 
          dailyStats={dailyStats}
          templates={templates}
        />
      </AppShell>
    );
  } else {
    // Modo Lista Geral: Prioridades da Equipe
    let people;
    let operators;
    let outreachGoal;
    let templates = [];

    try {
      const [mainPeople, sentPeople, activeOperators, goalStats, templatesRes] = await Promise.all([
        listPriorityPeople({ statuses: ["novo", "responder"], limit: 1000 }),
        listPriorityPeople({ statuses: ["abordado", "respondeu", "contato_confirmado"], limit: 300 }),
        getActiveOperators(),
        getOutreachGoalStats(),
        listMessageTemplates(),
      ]);
      const seen = new Set<string>();
      people = [...mainPeople, ...sentPeople].filter((person) => {
        if (seen.has(person.id)) return false;
        seen.add(person.id);
        return true;
      });
      operators = activeOperators;
      outreachGoal = goalStats;
      templates = (templatesRes || []).filter((t) => t.active);
    } catch (error) {
      return (
        <AppShell>
          <PageHeader title="Prioridades da Equipe" description="As interações mais recentes da sua base." />
          <RuntimeAlert
            title="Falha ao carregar pessoas"
            description={error instanceof Error ? error.message : "Não foi possível carregar as pessoas."}
          />
        </AppShell>
      );
    }

    return (
      <AppShell>
        <PageHeader
          compact
          eyebrow="Mapa de Missões"
          title="Prioridades da Equipe"
          description="Missões ativas da base, organizadas por urgência, dono e próximo passo."
        />
        <PeopleClient
          priorityPeople={people}
          operators={operators}
          outreachGoal={outreachGoal}
          currentOperatorId={session.internalUser.id}
          templates={templates}
        />
      </AppShell>
    );
  }
}
