const HTML_TAGS = /<[^>]*>/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeText(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return null;
  const sanitized = value.replace(HTML_TAGS, " ").replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
  return sanitized.slice(0, maxLength) || null;
}

export function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return null;
  const username = value.trim().replace(/^@+/, "").toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(username) ? username : null;
}

export function safeCount(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function safeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "sim", "yes"].includes(value.trim().toLowerCase());
  return value === 1;
}

export function safeUrl(value: unknown) {
  const text = sanitizeText(value, 500);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

