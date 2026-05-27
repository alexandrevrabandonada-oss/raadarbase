"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";

export type PilotDashboardData = {
  summary: {
    prioritizedToday: number;
    openTasks: number;
    tasksWithoutResponsible: number;
    messagesSent: number;
    responsesRecorded: number;
    referralsCreated: number;
    doNotContactCount: number;
    staleTasksCount: number; // > 48h
    pendingReferralsCount: number; // Responded but not referred
    waiting3DaysCount: number;
    waiting7DaysCount: number;
    archivedWithoutReturnCount: number;
    dmsPreparedToday: number;
    dmsConfirmedToday: number;
    dmsConfirmedThisWeek: number;
    forgetfulnessRate: number; // 0-100
    territoriesInMobilization: number;
    fieldActionsCompleted: number;
    dataUnderReview: number;
    dmsPreparedWithoutConfirmation: number;
    territoriesWithoutRecentAction: number;
  };
  responsibleBreakdown: Array<{
    operatorName: string;
    openTasks: number;
    completedTasks: number;
    responsesRecorded: number;
    pendingReferrals: number;
  }>;
  funnel: {
    prioritized: number;
    approached: number;
    responded: number;
    referred: number;
    firstAction: number;
  };
  operationHealth: {
    staleTasksCount: number;
    waiting7DaysCount: number;
    tasksWithoutResponsible: number;
    dmsPreparedWithoutConfirmation: number;
    territoriesWithoutRecentAction: number;
    dmsConfirmedThisWeek: number;
  };
  ethics: {
    doNotContactRespected: number;
    sensitiveNotesReviewed: number;
    dataUnderReview: number;
  };
  retrospective?: {
    totalReviewed: number;
    responseRateByTheme: Array<{ theme: string; rate: number; count: number }>;
    nonContactReasons: Array<{ reason: string; count: number }>;
  };
};

export async function getPilotDashboardData(options: { includeRetrospective?: boolean } = {}): Promise<PilotDashboardData> {
  if (shouldUseMockData()) {
    return {
      summary: {
        prioritizedToday: 15,
        openTasks: 42,
        tasksWithoutResponsible: 8,
        messagesSent: 25,
        responsesRecorded: 12,
        referralsCreated: 5,
        doNotContactCount: 3,
        staleTasksCount: 4,
        pendingReferralsCount: 7,
        waiting3DaysCount: 12,
        waiting7DaysCount: 5,
        archivedWithoutReturnCount: 18,
        dmsPreparedToday: 40,
        dmsConfirmedToday: 32,
        dmsConfirmedThisWeek: 115,
        forgetfulnessRate: 20,
        territoriesInMobilization: 8,
        fieldActionsCompleted: 5,
        dataUnderReview: 7,
        dmsPreparedWithoutConfirmation: 8,
        territoriesWithoutRecentAction: 2,
      },
      responsibleBreakdown: [
        { operatorName: "Operador 1", openTasks: 10, completedTasks: 5, responsesRecorded: 8, pendingReferrals: 2 },
        { operatorName: "Operador 2", openTasks: 15, completedTasks: 3, responsesRecorded: 4, pendingReferrals: 5 },
      ],
      funnel: {
        prioritized: 100,
        approached: 60,
        responded: 30,
        referred: 15,
        firstAction: 5,
      },
      operationHealth: {
        staleTasksCount: 4,
        waiting7DaysCount: 5,
        tasksWithoutResponsible: 8,
        dmsPreparedWithoutConfirmation: 8,
        territoriesWithoutRecentAction: 2,
        dmsConfirmedThisWeek: 115,
      },
      ethics: {
        doNotContactRespected: 3,
        sensitiveNotesReviewed: 24,
        dataUnderReview: 7,
      },
    };
  }

  const supabase = getSupabaseAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
  const staleIso = fortyEightHoursAgo.toISOString();
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysIso = threeDaysAgo.toISOString();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysIso = sevenDaysAgo.toISOString();

  // 1. Summary Metrics
  const [
    { count: prioritizedToday },
    { count: openTasks },
    { count: tasksWithoutResponsible },
    { count: messagesSent },
    { count: responsesRecorded },
    { count: referralsCreated },
    { count: doNotContactCount },
    { count: staleTasksCount },
    { count: waiting3DaysCount },
    { count: waiting7DaysCount },
    { count: archivedWithoutReturnCount },
    { count: dmsPreparedToday },
    { count: dmsConfirmedToday },
    { count: dmsConfirmedThisWeek }
  ] = await Promise.all([
    supabase.from("ig_people").select("*", { count: "exact", head: true }).gte("created_at", todayIso),
    supabase.from("outreach_tasks").select("*", { count: "exact", head: true }).is("completed_at", null),
    supabase.from("outreach_tasks").select("*", { count: "exact", head: true }).is("completed_at", null).is("responsible_id", null),
    supabase.from("ig_interactions").select("*", { count: "exact", head: true }).eq("type", "dm_manual").gte("occurred_at", todayIso),
    supabase.from("ig_people").select("*", { count: "exact", head: true }).eq("status", "respondeu").gte("updated_at", todayIso),
    supabase.from("ig_person_referrals").select("*", { count: "exact", head: true }).gte("created_at", todayIso),
    supabase.from("ig_people").select("*", { count: "exact", head: true }).eq("status", "nao_abordar").gte("updated_at", todayIso),
    supabase.from("outreach_tasks").select("*", { count: "exact", head: true }).is("completed_at", null).lt("updated_at", staleIso),
    supabase.from("outreach_tasks").select("*", { count: "exact", head: true }).eq("column_key", "esperando_resposta").is("completed_at", null).lt("updated_at", threeDaysIso),
    supabase.from("outreach_tasks").select("*", { count: "exact", head: true }).eq("column_key", "esperando_resposta").is("completed_at", null).lt("updated_at", sevenDaysIso),
    supabase.from("outreach_tasks").select("*", { count: "exact", head: true }).eq("column_key", "nao_insistir").is("completed_at", null),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "contact.dm_prepared").gte("created_at", todayIso),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "contact.dm_sent").gte("created_at", todayIso),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "contact.dm_sent").gte("created_at", sevenDaysIso),
  ]);

  const prepared = dmsPreparedToday || 0;
  const confirmed = dmsConfirmedToday || 0;
  const forgetfulnessRate = prepared > 0 ? Math.round(((prepared - confirmed) / prepared) * 100) : 0;

  // Fallback for pendingReferralsCount if RPC not available (simpler version)
  const { data: peopleResponded } = await supabase.from("ig_people").select("id").eq("status", "respondeu");
  const respondedIds = peopleResponded?.map(p => p.id) || [];
  const { data: referredPeople } = await supabase.from("ig_person_referrals").select("person_id").in("person_id", respondedIds);
  const referredIds = new Set(referredPeople?.map(r => r.person_id) || []);
  const actualPendingReferrals = respondedIds.filter(id => !referredIds.has(id)).length;

  const { data: operators } = await supabase.from("internal_users").select("id, full_name, email").eq("status", "active");
  const operatorIds = (operators || []).map((op) => op.id);
  const [operatorTasksResult, operatorRespondedPeopleResult] = operatorIds.length > 0
    ? await Promise.all([
        supabase.from("outreach_tasks").select("responsible_id, completed_at").in("responsible_id", operatorIds),
        supabase.from("ig_people").select("id, responsible_id").in("responsible_id", operatorIds).eq("status", "respondeu"),
      ])
    : [{ data: [] }, { data: [] }];

  const operatorRespondedIds = (operatorRespondedPeopleResult.data || []).map((person) => person.id);
  const { data: operatorReferrals } = operatorRespondedIds.length > 0
    ? await supabase.from("ig_person_referrals").select("person_id").in("person_id", operatorRespondedIds)
    : { data: [] };

  const referredPersonIds = new Set((operatorReferrals || []).map((referral) => referral.person_id));
  const operatorTasks = operatorTasksResult.data || [];
  const operatorRespondedPeople = operatorRespondedPeopleResult.data || [];

  const breakdown = (operators || []).map(op => {
    const opTasks = operatorTasks.filter((task) => task.responsible_id === op.id);
    const opRespondedPeople = operatorRespondedPeople.filter((person) => person.responsible_id === op.id);

    return {
      operatorName: op.full_name || op.email,
      openTasks: opTasks.filter((task) => !task.completed_at).length,
      completedTasks: opTasks.filter((task) => Boolean(task.completed_at)).length,
      responsesRecorded: opRespondedPeople.length,
      pendingReferrals: opRespondedPeople.filter((person) => !referredPersonIds.has(person.id)).length
    };
  });

  // 3. Funnel
  const [
    { count: fPrioritized },
    { count: fApproached },
    { count: fResponded },
    { count: fReferred },
    { count: fFirstAction }
  ] = await Promise.all([
    supabase.from("ig_people").select("*", { count: "exact", head: true }),
    supabase.from("ig_people").select("*", { count: "exact", head: true }).neq("status", "novo").neq("status", "responder"),
    supabase.from("ig_people").select("*", { count: "exact", head: true }).in("status", ["respondeu", "contato_confirmado"]),
    supabase.from("ig_person_referrals").select("person_id", { count: "exact", head: true }),
    supabase.from("ig_person_referrals").select("*", { count: "exact", head: true }).eq("status", "compareceu") // Example of "First Action"
  ]);

  let retrospective: PilotDashboardData["retrospective"];

  if (options.includeRetrospective !== false) {
    const [
      { data: themeStats },
      { data: doNotContactData }
    ] = await Promise.all([
      supabase.from("ig_people").select("themes, status"),
      supabase.from("ig_people").select("do_not_contact_reason").not("do_not_contact_reason", "is", null)
    ]);

    const themesMap = new Map<string, { total: number, responded: number }>();
    themeStats?.forEach(p => {
      p.themes?.forEach((t: string) => {
        const current = themesMap.get(t) || { total: 0, responded: 0 };
        current.total += 1;
        if (p.status === 'respondeu' || p.status === 'contato_confirmado') current.responded += 1;
        themesMap.set(t, current);
      });
    });

    const responseRateByTheme = Array.from(themesMap.entries())
      .map(([theme, stats]) => ({
        theme,
        rate: Math.round((stats.responded / stats.total) * 100),
        count: stats.total
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const reasonsMap = new Map<string, number>();
    doNotContactData?.forEach(p => {
      const reason = p.do_not_contact_reason || "Não especificado";
      reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
    });

    retrospective = {
      totalReviewed: fPrioritized || 0,
      responseRateByTheme,
      nonContactReasons: Array.from(reasonsMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  return {
    summary: {
      prioritizedToday: prioritizedToday || 0,
      openTasks: openTasks || 0,
      tasksWithoutResponsible: tasksWithoutResponsible || 0,
      messagesSent: messagesSent || 0,
      responsesRecorded: responsesRecorded || 0,
      referralsCreated: referralsCreated || 0,
      doNotContactCount: doNotContactCount || 0,
      staleTasksCount: staleTasksCount || 0,
      pendingReferralsCount: actualPendingReferrals,
      waiting3DaysCount: waiting3DaysCount || 0,
      waiting7DaysCount: waiting7DaysCount || 0,
      archivedWithoutReturnCount: archivedWithoutReturnCount || 0,
      dmsPreparedToday: prepared,
      dmsConfirmedToday: confirmed,
      dmsConfirmedThisWeek: dmsConfirmedThisWeek || 0,
      forgetfulnessRate: forgetfulnessRate,
      territoriesInMobilization: 0,
      fieldActionsCompleted: 0,
      dataUnderReview: 0,
      dmsPreparedWithoutConfirmation: (prepared - confirmed),
      territoriesWithoutRecentAction: 0,
    },
    responsibleBreakdown: breakdown,
    funnel: {
      prioritized: fPrioritized || 0,
      approached: fApproached || 0,
      responded: fResponded || 0,
      referred: fReferred || 0,
      firstAction: fFirstAction || 0,
    },
    operationHealth: {
      staleTasksCount: staleTasksCount || 0,
      waiting7DaysCount: waiting7DaysCount || 0,
      tasksWithoutResponsible: tasksWithoutResponsible || 0,
      dmsPreparedWithoutConfirmation: (prepared - confirmed),
      territoriesWithoutRecentAction: 0,
      dmsConfirmedThisWeek: dmsConfirmedThisWeek || 0,
    },
    ethics: {
      doNotContactRespected: doNotContactCount || 0,
      sensitiveNotesReviewed: 0,
      dataUnderReview: 0,
    },
    retrospective,
  };
}
