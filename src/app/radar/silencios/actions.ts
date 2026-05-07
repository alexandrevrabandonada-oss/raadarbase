"use server";

import { revalidatePath } from "next/cache";
import { requireInternalSession } from "@/lib/supabase/auth";
import { requireRole } from "@/lib/authz/roles";
import { createActionPlanItem } from "@/lib/data/action-plans";
import { createCorrectiveActionFromRadarFinding } from "@/lib/data/silence-radar-corrective-actions";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

function sanitize(value: FormDataEntryValue | null, limit: number): string {
  const str = typeof value === "string" ? value : "";
  return str.replace(/\s+/g, " ").trim().slice(0, limit);
}

function safeNumeric(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

export async function createNeighborhoodReinforcementItemAction(
  formData: FormData,
): Promise<void> {
  const user = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  const actionPlanId = sanitize(formData.get("action_plan_id"), 80);
  const bairro = sanitize(formData.get("bairro"), 120);
  const baselineCount = safeNumeric(formData.get("baseline_count"));

  if (!actionPlanId || !bairro) return;

  const title = `Reforçar escuta no bairro: ${bairro}`;
  const description = `Bairro identificado com baixa participação no Radar de Silêncios. Sugestões: reforçar chamada pública, criar card explicativo, abrir roda de escuta ou fazer pergunta pública.`;

  const item = await createActionPlanItem({
    action_plan_id: actionPlanId,
    type: "escuta_bairro",
    title,
    description,
    status: "todo",
    metadata: {
      origin: "silence_radar",
      bairro,
      created_by_email: user.email ?? null,
    },
  });

  const corrective = await createCorrectiveActionFromRadarFinding({
    actionPlanItemId: item.id,
    kind: "reforco_bairro",
    targetType: "bairro",
    targetLabel: bairro,
    sourceMetric: "report_count_in_window",
    baselineValue: baselineCount,
    baselineSnapshot: { reportCount: baselineCount ?? 0 },
    createdBy: user.id,
    createdByEmail: user.email ?? null,
    metadata: { action_plan_id: actionPlanId, origin: "silence_radar" },
  });

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: "silence_radar.corrective_action_created",
    entityType: "silence_radar_corrective_actions",
    entityId: corrective.id,
    summary: `Ação corretiva de reforço de escuta criada para bairro "${bairro}".`,
    metadata: {
      action_plan_id: actionPlanId,
      action_plan_item_id: item.id,
      bairro,
      baseline_count: baselineCount,
      origin: "silence_radar",
    },
  });

  revalidatePath("/radar/silencios");
  revalidatePath("/radar/silencios/acoes");
  revalidatePath("/acoes");
}

export async function createTopicExplanationItemAction(
  formData: FormData,
): Promise<void> {
  const user = await requireInternalSession();
  await requireRole(["admin", "operador"]);

  const actionPlanId = sanitize(formData.get("action_plan_id"), 80);
  const topic = sanitize(formData.get("topic"), 160);
  const baselineFormCount = safeNumeric(formData.get("baseline_form_count"));
  const baselineCommentCount = safeNumeric(formData.get("baseline_comment_count"));
  const kindRaw = sanitize(formData.get("kind"), 40);
  const kind = (
    ["reforco_bairro", "explicacao_pauta", "pergunta_publica", "roda_escuta", "card_explicativo"].includes(kindRaw)
      ? kindRaw
      : "explicacao_pauta"
  ) as "reforco_bairro" | "explicacao_pauta" | "pergunta_publica" | "roda_escuta" | "card_explicativo";

  if (!actionPlanId || !topic) return;

  const title = `Explicar pauta: ${topic}`;
  const description = `Pauta com alto engajamento em posts mas baixa conversão para formulário de escuta. Sugestões: criar card explicativo, fazer pergunta pública sobre a pauta ou abrir roda de escuta específica.`;

  const item = await createActionPlanItem({
    action_plan_id: actionPlanId,
    type: "material_explicativo",
    title,
    description,
    status: "todo",
    metadata: {
      origin: "silence_radar",
      topic,
      created_by_email: user.email ?? null,
    },
  });

  const corrective = await createCorrectiveActionFromRadarFinding({
    actionPlanItemId: item.id,
    kind,
    targetType: "pauta",
    targetLabel: topic,
    sourceMetric: "engagement_to_form_ratio",
    baselineValue: baselineFormCount,
    baselineSnapshot: {
      formCount: baselineFormCount ?? 0,
      commentCount: baselineCommentCount ?? 0,
    },
    createdBy: user.id,
    createdByEmail: user.email ?? null,
    metadata: { action_plan_id: actionPlanId, origin: "silence_radar" },
  });

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: "silence_radar.corrective_action_created",
    entityType: "silence_radar_corrective_actions",
    entityId: corrective.id,
    summary: `Ação corretiva de explicação de pauta criada para "${topic}".`,
    metadata: {
      action_plan_id: actionPlanId,
      action_plan_item_id: item.id,
      topic,
      baseline_form_count: baselineFormCount,
      baseline_comment_count: baselineCommentCount,
      origin: "silence_radar",
    },
  });

  revalidatePath("/radar/silencios");
  revalidatePath("/radar/silencios/acoes");
  revalidatePath("/acoes");
}

