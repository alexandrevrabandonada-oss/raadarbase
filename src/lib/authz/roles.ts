/**
 * Authorization helpers for internal role-based access control.
 *
 * Roles (least → most privilege):
 *   leitura    — read-only access to all data
 *   comunicacao — read people, posts, messages; copy templates
 *   operador   — sync Meta, manage contacts, manage messages
 *   admin      — everything, including user management and exports
 */
import { getInternalSession, requireInternalSession } from "@/lib/supabase/auth";
import type { InternalUserProfile } from "@/lib/supabase/internal-users";

export type InternalRole = "admin" | "operador" | "comunicacao" | "leitura";

// ─── Role capability matrix ───────────────────────────────────────────────────

export function canRunMetaSync(role: string): boolean {
  return role === "admin" || role === "operador";
}

export function canManageContacts(role: string): boolean {
  return role === "admin" || role === "operador";
}

export function canManageMessages(role: string): boolean {
  return role === "admin" || role === "operador" || role === "comunicacao";
}

export function canViewOperation(role: string): boolean {
  // All authenticated internal users can view operation
  return ["admin", "operador", "comunicacao", "leitura"].includes(role);
}

export function canExportContacts(role: string): boolean {
  return role === "admin";
}

export function canManageIncidents(role: string): boolean {
  return role === "admin" || role === "operador";
}

export function canApproveUsers(role: string): boolean {
  return role === "admin";
}

export function listActivePermissions(role: string): string[] {
  const perms: string[] = ["ver_dashboard", "ver_pessoas", "ver_posts", "ver_mensagens"];
  if (canManageMessages(role)) perms.push("gerenciar_mensagens");
  if (canManageContacts(role)) perms.push("gerenciar_contatos", "registrar_dm", "mudar_status");
  if (canRunMetaSync(role)) perms.push("sincronizar_meta", "reprocessar_sync");
  if (canManageIncidents(role)) perms.push("gerenciar_incidentes");
  if (canExportContacts(role)) perms.push("exportar_contatos");
  if (canApproveUsers(role)) perms.push("aprovar_usuarios", "gerenciar_usuarios");
  return perms;
}

// ─── Session helpers ─────────────────────────────────────────────────────────

export async function getCurrentInternalUser(): Promise<InternalUserProfile | null> {
  const session = await getInternalSession();
  return session?.internalUser ?? null;
}

/**
 * Requires current user to have one of the allowed roles.
 * Throws with a user-friendly message if denied.
 */
export async function requireRole(allowedRoles: InternalRole[]): Promise<InternalUserProfile> {
  const session = await requireInternalSession();
  const { internalUser } = session;
  if (!allowedRoles.includes(internalUser.role as InternalRole)) {
    const allowed = allowedRoles.join(", ");
    throw new Error(
      `Acesso negado. Esta ação exige um dos seguintes papéis: ${allowed}. Seu papel atual é "${internalUser.role}".`,
    );
  }
  return internalUser;
}
