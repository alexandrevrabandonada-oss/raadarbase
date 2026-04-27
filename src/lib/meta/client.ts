import type { Json } from "@/lib/supabase/database.types";

export type MetaResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code?: string; message: string };

export function isMetaConfigured() {
  return Boolean(
    process.env.META_GRAPH_VERSION &&
      process.env.META_ACCESS_TOKEN &&
      process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
  );
}

export function getMetaConfigStatus() {
  return {
    graphVersion: Boolean(process.env.META_GRAPH_VERSION),
    instagramBusinessAccountId: Boolean(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
    accessToken: Boolean(process.env.META_ACCESS_TOKEN),
  };
}

export function redactMetaMessage(message: string) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return message;
  return message.replaceAll(token, "[redacted]");
}

export async function metaGet<T>(
  path: string,
  params: Record<string, string | number | boolean> = {},
): Promise<MetaResult<T>> {
  const version = process.env.META_GRAPH_VERSION ?? "v23.0";
  const token = process.env.META_ACCESS_TOKEN;

  if (!token || !process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    return { ok: false, status: 400, code: "meta_not_configured", message: "Integração Meta não configurada." };
  }

  const url = new URL(`https://graph.facebook.com/${version}/${path.replace(/^\/+/, "")}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(url, { cache: "no-store" });
    const body = (await response.json()) as { error?: { code?: string | number; message?: string }; [key: string]: Json | undefined };

    if (!response.ok || body.error) {
      return {
        ok: false,
        status: response.status,
        code: body.error?.code ? String(body.error.code) : undefined,
        message: redactMetaMessage(body.error?.message ?? "Falha na API Meta."),
      };
    }

    return { ok: true, data: body as T };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      code: "meta_request_failed",
      message: error instanceof Error ? redactMetaMessage(error.message) : "Falha ao consultar API Meta.",
    };
  }
}
