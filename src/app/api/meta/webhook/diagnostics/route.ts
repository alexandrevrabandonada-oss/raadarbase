import { NextRequest, NextResponse } from "next/server";
import { getEnvironmentLabel } from "@/lib/config";
import { isWebhookEnabled } from "@/lib/meta/webhook-security";

export const dynamic = "force-dynamic";

function isAuthorizedForProduction(request: NextRequest): boolean {
  const configuredToken = process.env.INTERNAL_DIAGNOSTICS_TOKEN;
  if (!configuredToken) {
    return false;
  }

  const requestToken = request.headers.get("x-radar-diagnostics-token");
  return requestToken === configuredToken;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const environment = getEnvironmentLabel();

  if (environment === "production" && !isAuthorizedForProduction(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowedObjects = (process.env.META_WEBHOOK_ALLOWED_OBJECTS ?? "instagram")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const maxPayloadBytes = Number.parseInt(process.env.META_WEBHOOK_MAX_PAYLOAD_BYTES ?? "262144", 10);

  return NextResponse.json({
    app_url_configured: Boolean(process.env.APP_URL),
    meta_webhook_verify_token_present: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
    meta_app_secret_present: Boolean(process.env.META_APP_SECRET),
    meta_webhook_enabled: isWebhookEnabled(),
    meta_webhook_allowed_objects_configured: allowedObjects.length > 0,
    meta_webhook_allowed_objects_has_instagram: allowedObjects.includes("instagram"),
    meta_webhook_max_payload_bytes_configured: Number.isFinite(maxPayloadBytes) && maxPayloadBytes > 0,
    supabase_service_role_present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    environment,
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    timestamp: new Date().toISOString(),
  });
}
