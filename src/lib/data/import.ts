import type { PersonStatus, PriorityTemperature } from "@/lib/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type PersonImportRow = {
  username: string;
  displayName?: string;
  theme?: string;
  status?: string;
  temperature?: string;
  reason?: string;
  notes?: string;
  doNotContactReason?: string;
};

export type PersonImportPreview = {
  rowId: string;
  rawUsername: string;
  username: string;
  displayName: string | null;
  themes: string[];
  status: PersonStatus;
  temperature: PriorityTemperature | null;
  priorityReason: string | null;
  notes: string | null;
  doNotContactReason: string | null;
  isNew: boolean;
  isDuplicate: boolean;
  hasDoNotContactFlag: boolean;
  hasErrors: boolean;
  validationErrors: string[];
  existingId?: string;
};

export function normalizeUsername(input: string): string {
  let cleaned = input.trim().toLowerCase();
  
  // Extract from URL
  if (cleaned.includes("instagram.com/")) {
    const parts = cleaned.split("instagram.com/");
    if (parts.length > 1) {
      cleaned = parts[1].split("/")[0].split("?")[0];
    }
  }
  
  // Remove starting @ and spaces
  cleaned = cleaned.replace(/^@/, "").replace(/\s+/g, "");
  return cleaned;
}

export function parseStatus(val?: string): PersonStatus {
  if (!val) return "novo";
  const clean = val.toLowerCase().trim();
  switch (clean) {
    case "novo":
    case "responder":
    case "respondeu":
    case "contato_confirmado":
    case "nao_abordar":
    case "abordado":
      return clean as PersonStatus;
    case "observar":
      return "novo";
    case "quente":
    case "abordar":
    case "abordar hoje":
    case "para_abordar":
      return "responder";
    default:
      return "novo";
  }
}

export function parseTemperature(val?: string): PriorityTemperature | null {
  if (!val) return null;
  const clean = val.toLowerCase().trim();
  switch (clean) {
    case "quente":
    case "morno":
    case "frio":
      return clean as PriorityTemperature;
    default:
      return null;
  }
}

export async function validateImportBatch(rows: PersonImportRow[]): Promise<PersonImportPreview[]> {
  const previews: PersonImportPreview[] = [];
  const usernamesToFetch = new Set<string>();
  
  // First pass: normalize and collect usernames
  const parsedRows = rows.map((row, index) => {
    const username = normalizeUsername(row.username);
    if (username) usernamesToFetch.add(username);
    
    const errors: string[] = [];
    if (!username) errors.push("Username inválido ou vazio.");
    if (username.length > 30) errors.push("Username muito longo.");
    
    return {
      rowId: `row-${index}`,
      rawUsername: row.username,
      username,
      displayName: row.displayName?.trim() || null,
      themes: row.theme ? [row.theme.trim()] : [],
      status: parseStatus(row.status),
      temperature: parseTemperature(row.temperature),
      priorityReason: row.reason?.trim() || null,
      notes: row.notes?.trim() || null,
      doNotContactReason: row.doNotContactReason?.trim() || null,
      hasErrors: errors.length > 0,
      validationErrors: errors,
      existingId: undefined as string | undefined,
    };
  });
  
  // Fetch existing from DB
  const existingMap = new Map<string, { id: string; status: PersonStatus; do_not_contact_reason: string | null }>();
  if (usernamesToFetch.size > 0) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("ig_people")
      .select("id, username, status, do_not_contact_reason")
      .in("username", Array.from(usernamesToFetch));
      
    if (!error && data) {
      data.forEach(p => {
        existingMap.set(p.username, p);
      });
    }
  }
  
  // Local duplicate tracking in the same batch
  const seenInBatch = new Set<string>();

  for (const parsed of parsedRows) {
    if (parsed.hasErrors) {
      previews.push({ ...parsed, isNew: false, isDuplicate: false, hasDoNotContactFlag: false });
      continue;
    }
    
    const existing = existingMap.get(parsed.username);
    let isDuplicate = false;
    
    if (existing) {
      isDuplicate = true;
      parsed.existingId = existing.id;
      if (existing.status === "nao_abordar" || existing.do_not_contact_reason) {
        parsed.hasErrors = true;
        parsed.validationErrors.push(`Pessoa já marcou não abordar: ${existing.do_not_contact_reason || 'Privacidade solicitada'}.`);
      }
    } else if (seenInBatch.has(parsed.username)) {
      isDuplicate = true;
      parsed.hasErrors = true;
      parsed.validationErrors.push("Duplicado na mesma planilha de importação.");
    } else {
      seenInBatch.add(parsed.username);
    }
    
    // Safety guardrails
    if (parsed.status === "nao_abordar" && !parsed.doNotContactReason) {
      parsed.doNotContactReason = "Marcado na importação.";
    }

    previews.push({
      ...parsed,
      isNew: !isDuplicate,
      isDuplicate,
      hasDoNotContactFlag: parsed.status === "nao_abordar" || !!existing?.do_not_contact_reason,
    });
  }
  
  return previews;
}
