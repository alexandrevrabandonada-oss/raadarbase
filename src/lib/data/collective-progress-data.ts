"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldUseMockData } from "@/lib/config";

export type CollectiveProgressMetrics = {
  progress: {
    linksPrepared: number;
    conversationsInitiated: number;
    responsesRecorded: number;
    referralsMade: number;
    territoriesInMobilization: number;
    fieldActionsCompleted: number;
    doNotContactRespected: number;
  };
  funnel: {
    prepare: number;
    talk: number;
    register: number;
    refer: number;
    conclude: number;
  };
  operationHealth: {
    staleTasksCount: number;
    waiting7DaysCount: number;
    tasksWithoutResponsible: number;
    dmsPreparedWithoutConfirmation: number;
    territoriesWithoutRecentAction: number;
  };
  ethics: {
    doNotContactRespected: number;
    sensitiveNotesReviewed: number;
    dataUnderReview: number;
  };
};

export async function getCollectiveProgressMetrics(): Promise<CollectiveProgressMetrics> {
  if (shouldUseMockData()) {
    return {
      progress: {
        linksPrepared: 127,
        conversationsInitiated: 89,
        responsesRecorded: 54,
        referralsMade: 32,
        territoriesInMobilization: 8,
        fieldActionsCompleted: 5,
        doNotContactRespected: 18,
      },
      funnel: {
        prepare: 127,
        talk: 89,
        register: 54,
        refer: 32,
        conclude: 12,
      },
      operationHealth: {
        staleTasksCount: 4,
        waiting7DaysCount: 5,
        tasksWithoutResponsible: 8,
        dmsPreparedWithoutConfirmation: 15,
        territoriesWithoutRecentAction: 2,
      },
      ethics: {
        doNotContactRespected: 18,
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

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysIso = sevenDaysAgo.toISOString();

  // 1. Progress Metrics
  const [
    { count: linksPreparedCount },
    { count: conversationsInitiatedCount },
    { count: responsesRecordedCount },
    { count: referralsMadeCount },
    { count: doNotContactCount },
  ] = await Promise.all([
    supabase.from("ig_people").select("*", { count: "exact", head: true }),
    supabase.from("ig_people").select("*", { count: "exact", head: true }).neq("status", "novo"),
    supabase.from("ig_people").select("*", { count: "exact", head: true }).in("status", ["respondeu", "contato_confirmado"]),
    supabase.from("ig_person_referrals").select("*", { count: "exact", head: true }),
    supabase.from("ig_people").select("*", { count: "exact", head: true }).eq("status", "nao_abordar"),
  ]);

  // 2. Territories and Field Actions
  const [
    { data: territoriesData },
    { data: fieldActionsData },
  ] = await Promise.all([
    supabase.from("field_agenda_events")
      .select("neighborhood")
      .in("status", ["planned", "done"])
      .gte("starts_at", sevenDaysIso),
    supabase.from("field_agenda_events")
      .select("id")
      .eq("status", "done")
      .gte("updated_at", sevenDaysIso),
  ]);

  // Count unique territories with recent events
  const uniqueTerritories = new Set(
    (territoriesData || [])
      .map(t => t.neighborhood)
      .filter((n): n is string => n !== null)
  );

  // 3. DMs prepared but not confirmed
  const [
    { count: dmsPreparedCount },
    { count: dmsConfirmedCount },
  ] = await Promise.all([
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "contact.dm_prepared").gte("created_at", todayIso),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "contact.dm_sent").gte("created_at", todayIso),
  ]);

  const dmsPreparedWithoutConfirmation = (dmsPreparedCount || 0) - (dmsConfirmedCount || 0);

  // 4. Territories without recent action
  const [
    { data: allTerritories }
  ] = await Promise.all([
    supabase.from("field_agenda_events")
      .select("neighborhood")
      .neq("neighborhood", null)
  ]);

  const allTerritoriesSet = new Set(
    (allTerritories || [])
      .map(t => t.neighborhood)
      .filter((n): n is string => n !== null)
  );

  const recentTerritories = new Set(
    (territoriesData || [])
      .map(t => t.neighborhood)
      .filter((n): n is string => n !== null)
  );

  const territoriesWithoutRecentAction = Array.from(allTerritoriesSet).filter(
    t => !recentTerritories.has(t)
  ).length;

  // 5. Health metrics
  const [
    { count: staleTasksCount },
    { count: waiting7DaysCount },
    { count: tasksWithoutResponsibleCount },
  ] = await Promise.all([
    supabase.from("outreach_tasks")
      .select("*", { count: "exact", head: true })
      .is("completed_at", null)
      .lt("updated_at", staleIso),
    supabase.from("outreach_tasks")
      .select("*", { count: "exact", head: true })
      .eq("column_key", "esperando_resposta")
      .is("completed_at", null)
      .lt("updated_at", sevenDaysIso),
    supabase.from("outreach_tasks")
      .select("*", { count: "exact", head: true })
      .is("completed_at", null)
      .is("responsible_id", null),
  ]);

  // 6. Ethics - sensitive notes (using do_not_contact_reason as proxy for sensitive handling)
  const [
    { count: dataUnderReviewCount },
    { data: sensitiveData },
  ] = await Promise.all([
    supabase.from("ig_interactions")
      .select("*", { count: "exact", head: true })
      .not("metadata->'flags'->>'reviewed'", "is", null),
    supabase.from("ig_people")
      .select("id")
      .not("do_not_contact_reason", "is", null)
  ]);

  const sensitiveNotesReviewedCount = (sensitiveData || []).length;

  // 7. Funnel aggregation
  const [
    { count: funnelPrepareCount },
    { count: funnelTalkCount },
    { count: funnelRegisterCount },
    { count: funnelReferCount },
    { count: funnelConcludeCount },
  ] = await Promise.all([
    supabase.from("ig_people").select("*", { count: "exact", head: true }),
    supabase.from("ig_people").select("*", { count: "exact", head: true }).neq("status", "novo"),
    supabase.from("ig_people").select("*", { count: "exact", head: true }).in("status", ["respondeu", "contato_confirmado"]),
    supabase.from("ig_person_referrals").select("*", { count: "exact", head: true }),
    supabase.from("ig_person_referrals").select("*", { count: "exact", head: true }).eq("status", "compareceu"),
  ]);

  return {
    progress: {
      linksPrepared: linksPreparedCount || 0,
      conversationsInitiated: conversationsInitiatedCount || 0,
      responsesRecorded: responsesRecordedCount || 0,
      referralsMade: referralsMadeCount || 0,
      territoriesInMobilization: uniqueTerritories.size,
      fieldActionsCompleted: (fieldActionsData || []).length,
      doNotContactRespected: doNotContactCount || 0,
    },
    funnel: {
      prepare: funnelPrepareCount || 0,
      talk: funnelTalkCount || 0,
      register: funnelRegisterCount || 0,
      refer: funnelReferCount || 0,
      conclude: funnelConcludeCount || 0,
    },
    operationHealth: {
      staleTasksCount: staleTasksCount || 0,
      waiting7DaysCount: waiting7DaysCount || 0,
      tasksWithoutResponsible: tasksWithoutResponsibleCount || 0,
      dmsPreparedWithoutConfirmation,
      territoriesWithoutRecentAction,
    },
    ethics: {
      doNotContactRespected: doNotContactCount || 0,
      sensitiveNotesReviewed: sensitiveNotesReviewedCount,
      dataUnderReview: dataUnderReviewCount || 0,
    },
  };
}
