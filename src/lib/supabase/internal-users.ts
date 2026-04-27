import type { TableRow } from "@/lib/supabase/database.types";

export type InternalUserProfile = TableRow<"internal_users">;
export type InternalAccessReason = InternalUserProfile["status"] | "missing-profile" | "setup";

export function isInternalUserActive(status: InternalUserProfile["status"] | null | undefined) {
  return status === "active";
}

export function isInternalAccessReason(value: string | null | undefined): value is InternalAccessReason {
  return value === "pending" || value === "active" || value === "disabled" || value === "missing-profile" || value === "setup";
}

export function getInternalAccessMessage(reason: InternalAccessReason) {
  if (reason === "pending") {
    return "Cadastro recebido. Aguarde a liberação de um administrador interno antes de acessar o painel.";
  }
  if (reason === "disabled") {
    return "Seu acesso está desativado. Procure o administrador interno para reativação.";
  }
  if (reason === "missing-profile") {
    return "Seu usuário ainda não possui perfil interno. Verifique se a migration de autorização foi aplicada no Supabase.";
  }
  return "A configuração de autorização interna ainda não está pronta no ambiente atual.";
}
