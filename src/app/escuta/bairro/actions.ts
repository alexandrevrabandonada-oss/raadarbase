"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/app/actions/utils";
import type { TableInsert } from "@/lib/supabase/database.types";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

function valueOf(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function boolOf(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function boolOfAny(formData: FormData, keys: string[]) {
  return keys.some((key) => boolOf(formData, key));
}

function sanitize(value: string, limit: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

function redactContactPreview(value: string) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  if (normalized.includes("@")) {
    const [local, domain] = normalized.split("@");
    if (!local || !domain) return `${normalized.slice(0, 2)}***`;
    return `${local.slice(0, 2)}***@${domain}`;
  }

  const digits = normalized.replace(/\D/g, "");
  if (digits.length >= 4) {
    return `${digits.slice(0, 2)}***${digits.slice(-2)}`;
  }

  return `${normalized.slice(0, 2)}***`;
}

export type NeighborhoodListenPayload = {
  bairro: string;
  pauta: string;
  relato_curto: string;
  consent_to_contact: boolean;
  contato_opcional?: string;
  consentimento_explicito: boolean;
  aviso_privacidade_aceito: boolean;
  source_report_id?: string | null;
  consentimento_basico?: boolean;
};

export async function submitNeighborhoodListenObjectAction(payload: NeighborhoodListenPayload): Promise<ActionResult> {
  try {
    const bairro = sanitize(payload.bairro || "", 120);
    const pauta = sanitize(payload.pauta || "", 160);
    const relatoCurto = sanitize(payload.relato_curto || "", 800);
    const consentToContact = !!payload.consent_to_contact;
    const contatoOpcional = sanitize(payload.contato_opcional || "", 200);
    const consentimentoBasico = !!payload.consentimento_basico;
    const consentimentoExplicito = !!payload.consentimento_explicito || consentimentoBasico;
    const avisoPrivacidadeAceito = !!payload.aviso_privacidade_aceito || consentimentoBasico;
    const sourceReportId = sanitize(payload.source_report_id || "", 80) || null;

    if (!bairro || !pauta || !relatoCurto) {
      return { ok: false, error: "Preencha bairro, pauta e relato curto." };
    }

    if (!consentimentoExplicito || !avisoPrivacidadeAceito) {
      return { ok: false, error: "É preciso aceitar o aviso de privacidade e o consentimento explícito." };
    }

    const contactValue = consentToContact ? contatoOpcional : null;
    if (consentToContact && !contactValue) {
      return { ok: false, error: "Informe um contato apenas se quiser ser contatado." };
    }

    const supabase = getSupabaseAdminClient();
    const dbPayload: TableInsert<"bairro_escuta_submissions"> = {
      bairro,
      pauta,
      relato_curto: relatoCurto,
      quer_contato: consentToContact,
      consent_to_contact: consentToContact,
      contato_opcional: contactValue || null,
      consentimento_explicito: consentimentoExplicito,
      aviso_privacidade_aceito: avisoPrivacidadeAceito,
      status: "novo",
      contact_redacted: redactContactPreview(contactValue || ""),
      source_report_id: sourceReportId,
      metadata: {
        source: "public_form",
        wants_contact: consentToContact,
        quick_mode: consentimentoBasico,
      },
    };

    const { error } = await supabase.from("bairro_escuta_submissions").insert(dbPayload);
    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: null,
      actorEmail: null,
      action: "neighborhood_listen.submitted",
      entityType: "bairro_escuta_submissions",
      entityId: null,
      summary: "Relato de bairro registrado com consentimento explícito.",
      metadata: { source_report_id: sourceReportId, bairro, pauta, consent_to_contact: consentToContact },
    });

    revalidatePath("/escuta/bairro/admin");

    return { ok: true, message: "Escuta registrada com sucesso." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao registrar escuta." };
  }
}

export async function submitNeighborhoodListenAction(formData: FormData): Promise<ActionResult> {
  const consentToContact = boolOfAny(formData, ["consent_to_contact", "quer_contato"]);
  const consentimentoBasico = boolOf(formData, "consentimento_basico");
  return submitNeighborhoodListenObjectAction({
    bairro: valueOf(formData, "bairro"),
    pauta: valueOf(formData, "pauta"),
    relato_curto: valueOf(formData, "relato_curto"),
    consent_to_contact: consentToContact,
    contato_opcional: valueOf(formData, "contato_opcional"),
    consentimento_basico: consentimentoBasico,
    consentimento_explicito: boolOfAny(formData, ["consentimento_explicito", "consentimento_basico"]),
    aviso_privacidade_aceito: boolOfAny(formData, ["aviso_privacidade_aceito", "consentimento_basico"]),
    source_report_id: valueOf(formData, "source_report_id"),
  });
}