import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { PersonReferralStatus } from "@/lib/types";

// MISSAO_ELUTA_WEBHOOK_SECRET should be defined in .env.local
const WEBHOOK_SECRET = process.env.MISSAO_ELUTA_WEBHOOK_SECRET;

const EVENT_STATUS_MAP: Record<string, PersonReferralStatus> = {
  mission_eluta_link_sent: "recebeu_link",
  mission_eluta_accessed: "acessou",
  mission_eluta_issue_selected: "interessado",
  mission_eluta_first_mission_done: "fez_primeira_missao",
  mission_eluta_collaborator: "colaborador",
  mission_eluta_neighborhood_lead_candidate: "pode_puxar_missao",
};

const MAX_WEBHOOK_PAYLOAD_BYTES = 256 * 1024;

type MissionElutaPayload = {
  external_person_ref?: string;
  instagram_handle?: string;
  event_type?: string;
  occurred_at?: string;
  mission_slug?: string;
  issue?: string;
  metadata?: Record<string, unknown>;
  event_id?: string;
};

function hasMatchingWebhookSecret(authorization: string | null): boolean {
  if (!WEBHOOK_SECRET || !authorization) return false;

  const expected = Buffer.from(`Bearer ${WEBHOOK_SECRET}`);
  const received = Buffer.from(authorization);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function isValidOptionalText(value: unknown, maxLength = 512): value is string | undefined {
  return value === undefined || (typeof value === "string" && value.length <= maxLength);
}

function isValidPayload(payload: unknown): payload is MissionElutaPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const value = payload as MissionElutaPayload;

  return (
    isValidOptionalText(value.external_person_ref) &&
    isValidOptionalText(value.instagram_handle, 128) &&
    isValidOptionalText(value.event_type, 128) &&
    isValidOptionalText(value.occurred_at, 64) &&
    isValidOptionalText(value.mission_slug, 256) &&
    isValidOptionalText(value.issue, 1_000) &&
    isValidOptionalText(value.event_id, 256) &&
    (value.metadata === undefined || (typeof value.metadata === "object" && value.metadata !== null && !Array.isArray(value.metadata)))
  );
}

export async function POST(req: NextRequest) {
  // 1. Auth Validation
  const authHeader = req.headers.get("Authorization");
  if (!WEBHOOK_SECRET) {
    console.error("[MissaoElutaWebhook] MISSAO_ELUTA_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  if (!hasMatchingWebhookSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const rawPayload = await req.text();
    if (Buffer.byteLength(rawPayload, "utf8") > MAX_WEBHOOK_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!isValidPayload(payload)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payloadJson = payload as Json;

    const {
      external_person_ref,
      instagram_handle,
      event_type,
      occurred_at,
      mission_slug,
      issue,
      metadata = {},
      event_id, // Recommended idempotency key
    } = payload;

    if (!event_type || !EVENT_STATUS_MAP[event_type] || (!external_person_ref && !instagram_handle)) {
      return NextResponse.json({ error: "Invalid payload: missing event_type or identifiers" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // 2. Idempotency Check
    if (event_id) {
      const { data: existingEvent } = await supabase
        .from("webhook_events")
        .select("id")
        .eq("external_event_id", event_id)
        .eq("provider", "missao_eluta")
        .maybeSingle();

      if (existingEvent) {
        return NextResponse.json({ ok: true, message: "Event already processed", processed: false });
      }
    }

    // 3. Find Referral
    let referralId: string | null = null;
    let personId: string | null = null;

    // Try finding by external_person_ref if it looks like a UUID (it might be our referral id)
    if (external_person_ref && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(external_person_ref)) {
      const { data: refByUuid } = await supabase
        .from("ig_person_referrals")
        .select("id, person_id")
        .eq("id", external_person_ref)
        .maybeSingle();
      
      if (refByUuid) {
        referralId = refByUuid.id;
        personId = refByUuid.person_id;
      }
    }

    // Try finding by external_id if not found
    if (!referralId && external_person_ref) {
      const { data: refByExt } = await supabase
        .from("ig_person_referrals")
        .select("id, person_id")
        .eq("external_id", external_person_ref)
        .eq("target_type", "missao_eluta")
        .maybeSingle();
      
      if (refByExt) {
        referralId = refByExt.id;
        personId = refByExt.person_id;
      }
    }

    // Try finding by instagram_handle
    if (!referralId && instagram_handle) {
      const handle = instagram_handle.replace("@", "").toLowerCase();
      const { data: person } = await supabase
        .from("ig_people")
        .select("id")
        .eq("username", handle)
        .maybeSingle();
      
      if (person) {
        personId = person.id;
        const { data: refByPerson } = await supabase
          .from("ig_person_referrals")
          .select("id")
          .eq("person_id", person.id)
          .eq("target_type", "missao_eluta")
          .maybeSingle();
        
        if (refByPerson) {
          referralId = refByPerson.id;
        }
      }
    }

    if (!personId) {
      // Record in audit log but person not found
      await supabase.from("audit_logs").insert({
        action: "missao_eluta.event_received_person_not_found",
        entity_type: "webhook",
        metadata: { payload: payloadJson },
      });
      return NextResponse.json({ ok: false, message: "Person or referral not found", person_found: false }, { status: 404 });
    }

    // 4. Map Status and Update
    const newStatus = EVENT_STATUS_MAP[event_type];
    
    if (referralId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
        last_event_at: occurred_at || new Date().toISOString(),
        last_event_type: event_type,
        last_event_source: "webhook",
        metadata: {
          ...metadata,
          mission_slug,
          issue,
        },
      };

      if (newStatus) {
        updatePayload.status = newStatus;
      }

      const { error: updateError } = await supabase
        .from("ig_person_referrals")
        .update(updatePayload)
        .eq("id", referralId);

      if (updateError) throw updateError;
    } else {
      // Create referral if it doesn't exist but person was found?
      // "Não transformar automaticamente pessoa em voluntário"
      // But here we are just creating the referral record to track the mission.
      const { error: insertError } = await supabase
        .from("ig_person_referrals")
        .insert({
          person_id: personId,
          target_type: "missao_eluta",
          status: newStatus || "recebeu_link",
          external_id: external_person_ref,
          last_event_at: occurred_at || new Date().toISOString(),
          last_event_type: event_type,
          last_event_source: "webhook",
          metadata: {
            mission_slug,
            issue,
            ...metadata
          }
        });
      
      if (insertError) throw insertError;
    }

    // 5. Audit Log
    await supabase.from("audit_logs").insert({
      action: "missao_eluta.event_processed",
      entity_type: "ig_people",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entity_id: personId as any,
      metadata: { event_type, referral_id: referralId, event_id },
    });

    // 6. Idempotency Record
    if (event_id) {
      await supabase.from("webhook_events").insert({
        provider: "missao_eluta",
        external_event_id: event_id,
        event_type,
        payload: payloadJson,
      });
    }

    return NextResponse.json({ ok: true, processed: true });

  } catch (error) {
    console.error("[MissaoElutaWebhook] Error processing event:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
