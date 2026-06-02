/**
 * Form data utilities for consistent handling across the app
 * Used in escuta/*, campo/*, and acoes/* forms
 */

/**
 * Extract string value from FormData
 */
export function valueOf(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Extract boolean value from FormData (checkbox)
 */
export function boolOf(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === true;
}

/**
 * Extract number value from FormData
 */
export function numberOf(formData: FormData, key: string): number | null {
  const value = valueOf(formData, key);
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

/**
 * Extract date value from FormData
 */
export function dateOf(formData: FormData, key: string): Date | null {
  const value = valueOf(formData, key);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Extract array of strings from FormData (multiple values with same key)
 */
export function arrayOf(formData: FormData, key: string): string[] {
  const values: string[] = [];
  formData.forEach((value, k) => {
    if (k === key && typeof value === "string") {
      values.push(value.trim());
    }
  });
  return values;
}

/**
 * Sanitize string input (trim and remove special characters)
 */
export function sanitize(value: string, options: { maxLength?: number; allowHtml?: boolean } = {}): string {
  const { maxLength = 500, allowHtml = false } = options;
  
  let sanitized = value.trim();
  
  if (!allowHtml) {
    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, "");
  }
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }
  
  return sanitized;
}

/**
 * Extract and validate form data with schema
 */
export async function validateFormData<T>(
  formData: FormData,
  schema: {
    [K in keyof T]: (formData: FormData) => T[K] | Promise<T[K]>;
  }
): Promise<T> {
  const result: any = {};
  
  for (const [key, validator] of Object.entries(schema)) {
    result[key] = await Promise.resolve(validator(formData));
  }
  
  return result as T;
}

/**
 * Create FormData from object
 */
export function objectToFormData(obj: Record<string, any>): FormData {
  const formData = new FormData();
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    
    if (Array.isArray(value)) {
      value.forEach(v => formData.append(key, String(v)));
    } else if (typeof value === "object" && !(value instanceof File)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  }
  
  return formData;
}
