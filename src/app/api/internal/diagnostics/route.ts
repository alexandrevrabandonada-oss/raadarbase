import type { NextRequest } from "next/server";
import { GET as getWebhookDiagnostics } from "@/app/api/meta/webhook/diagnostics/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return getWebhookDiagnostics(request);
}
