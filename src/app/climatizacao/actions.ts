"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz/roles";
import { getClimateAdminClient } from "@/lib/climatizacao/data";

type Result = { ok: true; message: string } | { ok: false; error: string };

function id(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(parsed)) throw new Error("Protocolo inválido.");
  return parsed;
}

function text(value: FormDataEntryValue | null, max = 1000) {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}

function dateValue(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  const date = raw ? new Date(raw) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error("Data inválida.");
  return date;
}

function plusDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function submitClimateProtocolAction(_previous: Result | null, formData: FormData): Promise<Result> {
  try {
    await requireRole(["admin", "operador"]);
    const protocolId = id(formData.get("id"));
    const number = text(formData.get("protocol_number"), 160);
    if (number.length < 3) throw new Error("Informe o número do protocolo.");

    const submittedAt = dateValue(formData.get("submitted_at"));
    const dueAt = plusDays(submittedAt, 20);
    const extensionDueAt = plusDays(submittedAt, 30);
    const db = getClimateAdminClient();

    const { error } = await db.from("clima_protocols").update({
      protocol_number: number,
      status: "submitted",
      submitted_at: submittedAt.toISOString(),
      due_at: dueAt.toISOString(),
      extension_due_at: extensionDueAt.toISOString(),
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", protocolId);
    if (error) throw new Error(error.message);

    await db.from("clima_protocol_events").insert({
      protocol_id: protocolId,
      event_type: "submitted",
      event_at: submittedAt.toISOString(),
      public_note: "Pedido protocolado. Prazo inicial estimado em 20 dias, sujeito ao prazo oficial exibido no Fala.BR.",
    });

    revalidatePath("/climatizacao");
    return { ok: true, message: "Protocolo registrado." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao registrar protocolo." };
  }
}

export async function extendClimateProtocolAction(_previous: Result | null, formData: FormData): Promise<Result> {
  try {
    await requireRole(["admin", "operador"]);
    const protocolId = id(formData.get("id"));
    const note = text(formData.get("note"), 800) || "Prorrogação de prazo registrada.";
    const db = getClimateAdminClient();

    const { data: row, error: readError } = await db
      .from("clima_protocols")
      .select("due_at,extension_due_at")
      .eq("id", protocolId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!row) throw new Error("Pedido não encontrado.");

    const newDue = row.extension_due_at ?? (row.due_at ? plusDays(new Date(row.due_at), 10).toISOString() : null);
    if (!newDue) throw new Error("Pedido ainda não possui prazo.");

    const { error } = await db.from("clima_protocols").update({
      due_at: newDue,
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", protocolId);
    if (error) throw new Error(error.message);

    await db.from("clima_protocol_events").insert({
      protocol_id: protocolId,
      event_type: "extended",
      public_note: note,
    });

    revalidatePath("/climatizacao");
    return { ok: true, message: "Prorrogação registrada." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao registrar prorrogação." };
  }
}

export async function answerClimateProtocolAction(_previous: Result | null, formData: FormData): Promise<Result> {
  try {
    await requireRole(["admin", "operador"]);
    const protocolId = id(formData.get("id"));
    const responseUrl = text(formData.get("response_url"), 500);
    const summary = text(formData.get("response_summary"), 1800);
    if (!summary) throw new Error("Resuma a resposta recebida.");
    if (responseUrl && !/^https:\/\//i.test(responseUrl)) throw new Error("O link da resposta deve usar HTTPS.");

    const db = getClimateAdminClient();
    const now = new Date().toISOString();
    const { error } = await db.from("clima_protocols").update({
      status: "answered",
      response_url: responseUrl || null,
      response_summary: summary,
      last_checked_at: now,
      updated_at: now,
    }).eq("id", protocolId);
    if (error) throw new Error(error.message);

    await db.from("clima_protocol_events").insert({
      protocol_id: protocolId,
      event_type: "answered",
      public_note: summary.slice(0, 1000),
      source_url: responseUrl || null,
    });

    revalidatePath("/climatizacao");
    return { ok: true, message: "Resposta registrada." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao registrar resposta." };
  }
}

export async function updateChangeOrgIntegrationAction(_previous: Result | null, formData: FormData): Promise<Result> {
  try {
    await requireRole(["admin", "operador"]);
    const status = text(formData.get("status"), 20);
    const publicUrl = text(formData.get("public_url"), 500);
    const publicLabel = text(formData.get("public_label"), 120) || "Assinar também no Change.org";

    if (!["draft", "active", "disabled"].includes(status)) throw new Error("Status inválido.");
    if (status === "active" && !/^https:\/\/(www\.)?change\.org\//i.test(publicUrl)) {
      throw new Error("Para ativar, informe uma URL válida do Change.org.");
    }

    const db = getClimateAdminClient();
    const { error } = await db.from("clima_integrations").update({
      status,
      public_url: publicUrl || null,
      public_label: publicLabel,
      minimum_age: 16,
      updated_at: new Date().toISOString(),
    }).eq("provider", "change_org");
    if (error) throw new Error(error.message);

    revalidatePath("/climatizacao");
    return { ok: true, message: status === "active" ? "Ponte com Change.org ativada no painel público." : "Integração atualizada." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao atualizar integração." };
  }
}


export async function addClimateEvidenceAction(_previous: Result | null, formData: FormData): Promise<Result> {
  try {
    await requireRole(["admin", "operador"]);

    const evidenceType = text(formData.get("evidence_type"), 40);
    const sourceKind = text(formData.get("source_kind"), 40);
    const title = text(formData.get("title"), 240);
    const sourceUrl = text(formData.get("source_url"), 500);
    const sourceAuthority = text(formData.get("source_authority"), 200);
    const documentDate = text(formData.get("document_date"), 20);
    const verificationStatus = text(formData.get("verification_status"), 40) || "source_seen";
    const publicNote = text(formData.get("public_note"), 1600);
    const contentSha256 = text(formData.get("content_sha256"), 64).toLowerCase();
    const schoolRaw = text(formData.get("school_id"), 30);
    const protocolRaw = text(formData.get("protocol_id"), 80);

    const allowedEvidence = new Set([
      "law","official_document","official_response","contract","maintenance_order",
      "procurement","technical_note","community_summary","news","other",
    ]);
    const allowedSource = new Set(["official","community","media","document","other"]);
    const allowedStatus = new Set(["source_seen","document_verified","officially_confirmed","disputed","superseded"]);

    if (!allowedEvidence.has(evidenceType)) throw new Error("Tipo de evidência inválido.");
    if (!allowedSource.has(sourceKind)) throw new Error("Tipo de fonte inválido.");
    if (!allowedStatus.has(verificationStatus)) throw new Error("Status de verificação inválido.");
    if (title.length < 3) throw new Error("Informe um título.");
    if (sourceUrl && !/^https:\/\//i.test(sourceUrl)) throw new Error("A fonte deve usar HTTPS.");
    if (documentDate && !/^\d{4}-\d{2}-\d{2}$/.test(documentDate)) throw new Error("Data do documento inválida.");
    if (contentSha256 && !/^[a-f0-9]{64}$/.test(contentSha256)) throw new Error("SHA-256 deve ter 64 caracteres hexadecimais.");

    const schoolId = schoolRaw ? Number(schoolRaw) : null;
    if (schoolId !== null && (!Number.isInteger(schoolId) || schoolId <= 0)) throw new Error("Escola inválida.");

    const protocolId = protocolRaw || null;
    if (protocolId && !/^[0-9a-f-]{36}$/i.test(protocolId)) throw new Error("Protocolo inválido.");

    const db = getClimateAdminClient();
    const { error } = await db.from("clima_evidence").insert({
      evidence_type: evidenceType,
      source_kind: sourceKind,
      title,
      source_url: sourceUrl || null,
      source_authority: sourceAuthority || null,
      document_date: documentDate || null,
      content_sha256: contentSha256 || null,
      verification_status: verificationStatus,
      public_note: publicNote || null,
      school_id: schoolId,
      protocol_id: protocolId,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/climatizacao");
    return { ok: true, message: "Evidência registrada e adicionada ao ledger público." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao registrar evidência." };
  }
}


function uuidValue(value: FormDataEntryValue | null, label = "Identificador") {
  const parsed = String(value ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(parsed)) throw new Error(label + " inválido.");
  return parsed;
}

export async function updateClimateCaseStatusAction(_previous: Result | null, formData: FormData): Promise<Result> {
  try {
    await requireRole(["admin", "operador"]);
    const caseId = uuidValue(formData.get("case_id"), "Caso");
    const status = text(formData.get("status"), 40);
    const note = text(formData.get("public_note"), 1600);

    const allowed = new Set(["reported","documenting","official_request","awaiting_response","answered","resolved","reopened"]);
    if (!allowed.has(status)) throw new Error("Status inválido.");

    const db = getClimateAdminClient();
    const { data: current, error: readError } = await db
      .from("clima_school_cases")
      .select("status,public_note")
      .eq("id", caseId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!current) throw new Error("Caso não encontrado.");

    if (status === "resolved") {
      if (note.length < 8) throw new Error("Para marcar como resolvido, inclua uma nota pública explicando a base da resolução.");

      const [evidenceLinks, protocolLinks] = await Promise.all([
        db.from("clima_case_evidence").select("case_id", { count: "exact", head: true }).eq("case_id", caseId),
        db.from("clima_case_protocols").select("case_id", { count: "exact", head: true }).eq("case_id", caseId),
      ]);
      if (evidenceLinks.error) throw new Error(evidenceLinks.error.message);
      if (protocolLinks.error) throw new Error(protocolLinks.error.message);
      if ((evidenceLinks.count ?? 0) + (protocolLinks.count ?? 0) === 0) {
        throw new Error("Para resolver um caso, vincule ao menos uma evidência ou protocolo.");
      }
    }

    const now = new Date().toISOString();
    const changes: Record<string, unknown> = {
      status,
      updated_at: now,
      resolved_at: status === "resolved" ? now : null,
    };
    if (note) changes.public_note = note;

    const { error } = await db.from("clima_school_cases").update(changes).eq("id", caseId);
    if (error) throw new Error(error.message);

    if (current.status === status && note) {
      const { error: noteError } = await db.from("clima_case_events").insert({
        case_id: caseId,
        event_type: "note",
        from_status: status,
        to_status: status,
        public_note: note,
      });
      if (noteError) throw new Error(noteError.message);
    }

    revalidatePath("/climatizacao");
    return { ok: true, message: "Caso atualizado." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao atualizar caso." };
  }
}

export async function linkClimateCaseEvidenceAction(_previous: Result | null, formData: FormData): Promise<Result> {
  try {
    await requireRole(["admin", "operador"]);
    const caseId = uuidValue(formData.get("case_id"), "Caso");
    const evidenceId = uuidValue(formData.get("evidence_id"), "Evidência");
    const db = getClimateAdminClient();

    const { error } = await db.from("clima_case_evidence").insert({
      case_id: caseId,
      evidence_id: evidenceId,
    });
    if (error?.code === "23505") return { ok: true, message: "Evidência já estava vinculada." };
    if (error) throw new Error(error.message);

    revalidatePath("/climatizacao");
    return { ok: true, message: "Evidência vinculada ao caso." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao vincular evidência." };
  }
}

export async function linkClimateCaseProtocolAction(_previous: Result | null, formData: FormData): Promise<Result> {
  try {
    await requireRole(["admin", "operador"]);
    const caseId = uuidValue(formData.get("case_id"), "Caso");
    const protocolId = uuidValue(formData.get("protocol_id"), "Protocolo");
    const db = getClimateAdminClient();

    const { error } = await db.from("clima_case_protocols").insert({
      case_id: caseId,
      protocol_id: protocolId,
    });
    if (error?.code === "23505") return { ok: true, message: "Protocolo já estava vinculado." };
    if (error) throw new Error(error.message);

    revalidatePath("/climatizacao");
    return { ok: true, message: "Protocolo vinculado ao caso." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao vincular protocolo." };
  }
}

export async function reviewEvidenceSubmissionAction(_previous: Result | null, formData: FormData): Promise<Result> {
  try {
    await requireRole(["admin", "operador"]);
    const submissionId = uuidValue(formData.get("submission_id"), "Sugestão");
    const decision = text(formData.get("decision"), 20);
    const reviewNote = text(formData.get("review_note"), 1200);
    if (!["accepted","rejected"].includes(decision)) throw new Error("Decisão inválida.");

    const db = getClimateAdminClient();
    const { data: submission, error: readError } = await db
      .from("clima_evidence_submissions")
      .select("id,school_id,issue,title,source_url,source_kind,public_note,status")
      .eq("id", submissionId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!submission) throw new Error("Sugestão não encontrada.");
    if (submission.status !== "pending") return { ok: true, message: "Sugestão já revisada." };

    const now = new Date().toISOString();

    if (decision === "rejected") {
      const { error } = await db.from("clima_evidence_submissions").update({
        status: "rejected",
        review_note: reviewNote || "Não incorporada ao catálogo público.",
        reviewed_at: now,
      }).eq("id", submissionId);
      if (error) throw new Error(error.message);

      revalidatePath("/climatizacao");
      return { ok: true, message: "Sugestão rejeitada e mantida fora do catálogo público." };
    }

    const { data: evidence, error: evidenceError } = await db.from("clima_evidence").insert({
      school_id: submission.school_id,
      issue: submission.issue || null,
      evidence_type: submission.source_kind === "official" ? "official_document"
        : submission.source_kind === "media" ? "news"
        : submission.source_kind === "document" ? "other"
        : "other",
      source_kind: submission.source_kind,
      title: submission.title,
      source_url: submission.source_url,
      verification_status: "source_seen",
      public_note: submission.public_note || null,
    }).select("id").single();
    if (evidenceError) throw new Error(evidenceError.message);

    const { error: updateError } = await db.from("clima_evidence_submissions").update({
      status: "accepted",
      review_note: reviewNote || "Fonte incorporada ao catálogo para verificação pública.",
      resulting_evidence_id: evidence.id,
      reviewed_at: now,
    }).eq("id", submissionId);
    if (updateError) throw new Error(updateError.message);

    if (submission.issue) {
      const { data: caseRow, error: caseError } = await db
        .from("clima_school_cases")
        .select("id")
        .eq("school_id", submission.school_id)
        .eq("issue", submission.issue)
        .maybeSingle();
      if (caseError) throw new Error(caseError.message);

      if (caseRow) {
        const { error: linkError } = await db.from("clima_case_evidence").insert({
          case_id: caseRow.id,
          evidence_id: evidence.id,
        });
        if (linkError && linkError.code !== "23505") throw new Error(linkError.message);
      }
    }

    revalidatePath("/climatizacao");
    return { ok: true, message: "Fonte aceita, publicada como evidência e registrada no ledger." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao revisar sugestão." };
  }
}
