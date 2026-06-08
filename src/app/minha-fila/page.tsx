import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RuntimeAlert } from "@/components/runtime-alert";
import { listPriorityPeople } from "@/lib/data/people-priority";
import { listOutreachTasks } from "@/lib/data/outreach";
import { listInteractions } from "@/lib/data/interactions";
import { listPersonReferralsForPerson } from "@/lib/data/referrals";
import { listAuditLogsForEntity } from "@/lib/data/audit";
import { buildQueueMissionPlan, orderQueueByMissionPlan } from "@/lib/missions/queue-mission-adapter";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { QueueClient } from "./queue-client";
import { Metadata } from "next";
import { shouldUseMockData } from "@/lib/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOutreachGoalStats } from "@/lib/data/outreach-goal";
import { getActiveOperators } from "../abordagem/team-actions";
import { PeopleClient } from "../pessoas/people-client";

export const metadata: Metadata = {
  title: "Prioridades da Equipe | Modo Operador",
  description: "Trabalhe nas missões ativas da base organizadas por urgência, dono e próximo passo.",
};

export const dynamic = "force-dynamic";

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
    let dailyStats = {
      mySentCount: 0,
      othersSentCount: 0,
      goal: 15,
    };

    try {
      const isMock = shouldUseMockData();
      const [priorityPeopleRes, outreachTasksRes, todayLogsRes] = await Promise.all([
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
      ]);

      priorityPeople = priorityPeopleRes;
      outreachTasks = outreachTasksRes;

      if (isMock) {
        dailyStats.mySentCount = 5;
        dailyStats.othersSentCount = 12;
      } else if (todayLogsRes && todayLogsRes.data) {
        const myId = session.internalUser.id;
        const myEmail = session.email;
        todayLogsRes.data.forEach((log: any) => {
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

    const oldPendencies = filteredQueue.filter(person => person.isPendingResponse);
    const activeQueue = filteredQueue.filter(person => !person.isPendingResponse);

    let missionPlan = null;
    let orderedActiveQueue = activeQueue;

    try {
      const taskMap = new Map<string, typeof outreachTasks>();
      for (const task of outreachTasks || []) {
        const existing = taskMap.get(task.personId) || [];
        existing.push(task);
        taskMap.set(task.personId, existing);
      }

      const missionSources = await Promise.all(
        activeQueue.map(async (person) => ({
          person,
          interactions: await listInteractions(person.id),
          tasks: taskMap.get(person.id) || [],
          referrals: await listPersonReferralsForPerson(person.id),
          auditLogs: await listAuditLogsForEntity("ig_people", person.id, 12),
        })),
      );

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
          description="Uma pessoa por vez: preparar a mensagem, enviar manualmente e registrar o envio sem perder o próximo passo." 
        />
        
        <QueueClient 
          initialQueue={orderedActiveQueue}
          oldPendencies={oldPendencies}
          missionPlan={missionPlan}
          operatorName={session.internalUser.full_name || session.email || "Operador"} 
          dailyStats={dailyStats}
        />
      </AppShell>
    );
  } else {
    // Modo Lista Geral: Prioridades da Equipe
    let people;
    let operators;
    let outreachGoal;

    try {
      const [mainPeople, sentPeople, activeOperators, goalStats] = await Promise.all([
        listPriorityPeople({ statuses: ["novo", "responder"], limit: 1000 }),
        listPriorityPeople({ statuses: ["abordado", "respondeu", "contato_confirmado"], limit: 300 }),
        getActiveOperators(),
        getOutreachGoalStats(),
      ]);
      const seen = new Set<string>();
      people = [...sentPeople, ...mainPeople].filter((person) => {
        if (seen.has(person.id)) return false;
        seen.add(person.id);
        return true;
      });
      operators = activeOperators;
      outreachGoal = goalStats;
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
        />
      </AppShell>
    );
  }
}
