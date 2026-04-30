import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireInternalPageSession } from "@/lib/supabase/auth";
import { listActivePermissions } from "@/lib/authz/roles";
import { countOpenIncidents, countCriticalIncidents } from "@/lib/data/incidents";
import { isMetaConfigured } from "@/lib/meta/client";
import { isSupabaseConfigured } from "@/lib/config";
import { isWebhookEnabled, isWebhookConfigured } from "@/lib/meta/webhook-security";

export const dynamic = "force-dynamic";

const CHECKLIST_OPERACIONAL = [
  "Sincronizações Meta executadas apenas manualmente",
  "DMs registradas manualmente após envio humano",
  "Exportação de CSV exige papel admin",
  "Anonimização exige papel admin",
  "Toda ação sensível gera audit_log",
  "Incidentes revisados periodicamente",
  "Políticas de retenção configuradas (180–365 dias)",
];

const CHECKLIST_LGPD = [
  "Contatos somente com consentimento explícito registrado",
  "Opção 'Não abordar' sempre respeitada",
  "Anonimização disponível para remoção de dados",
  "Nenhum dado de saúde, renda, raça ou orientação coletado",
  "Nenhum score político individual calculado",
  "Nenhuma inferência de voto ou ideologia",
  "Nenhuma exportação sem consentimento registrado",
];

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2 py-1 text-sm">
      <span className={ok ? "text-green-600" : "text-red-600"}>{ok ? "✓" : "✗"}</span>
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

export default async function GovernancaPage() {
  const session = await requireInternalPageSession("/governanca");
  const { internalUser } = session;
  const role = internalUser.role;
  const permissions = listActivePermissions(role);

  const [openIncidents, criticalIncidents] = await Promise.all([
    countOpenIncidents().catch(() => null),
    countCriticalIncidents().catch(() => null),
  ]);

  const metaConfigured = isMetaConfigured();
  const supabaseConfigured = isSupabaseConfigured();
  const webhookConfigured = isWebhookConfigured();
  const webhookEnabled = isWebhookEnabled();

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    operador: "Operador",
    comunicacao: "Comunicação",
    leitura: "Leitura",
  };

  const roleVariant = (r: string) => {
    if (r === "admin") return "default";
    if (r === "operador") return "secondary";
    return "outline";
  };

  return (
    <AppShell>
      <PageHeader
        title="Governança"
        description="Visão geral de permissões, checklists operacionais e estado do sistema."
      />

      {/* Aviso fixo obrigatório */}
      <div
        id="governance-warning"
        className="mb-6 rounded-md border border-yellow-500/50 bg-yellow-50 p-4 text-sm font-semibold text-yellow-900"
      >
        ⚠️ O Radar de Base organiza abordagem manual e consentida. Não use para disparo em massa, automação de DM ou
        coleta sem consentimento.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessão atual */}
        <Card>
          <CardHeader>
            <CardTitle>Sessão interna</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Usuário</p>
              <p className="font-semibold">{internalUser.email}</p>
            </div>
            {internalUser.full_name ? (
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="font-semibold">{internalUser.full_name}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs text-muted-foreground">Papel interno</p>
              <Badge variant={roleVariant(role)} className="mt-1">
                {roleLabels[role] ?? role}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={internalUser.status === "active" ? "secondary" : "destructive"} className="mt-1">
                {internalUser.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Permissões ativas */}
        <Card>
          <CardHeader>
            <CardTitle>Permissões ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {permissions.map((perm) => (
                <Badge key={perm} variant="secondary" className="text-xs">
                  {perm.replaceAll("_", " ")}
                </Badge>
              ))}
            </div>
            {permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma permissão ativa.</p>
            ) : null}
          </CardContent>
        </Card>

        {/* Status do sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Status do sistema</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ChecklistItem ok={supabaseConfigured} label="Supabase configurado" />
            <ChecklistItem ok={metaConfigured} label="Integração Meta configurada" />
            <ChecklistItem
              ok={openIncidents !== null && openIncidents === 0}
              label={
                openIncidents === null
                  ? "Incidentes abertos (erro ao carregar)"
                  : `Incidentes abertos: ${openIncidents}`
              }
            />
            <ChecklistItem
              ok={criticalIncidents !== null && criticalIncidents === 0}
              label={
                criticalIncidents === null
                  ? "Incidentes críticos (erro ao carregar)"
                  : `Incidentes críticos: ${criticalIncidents}`
              }
            />
            <ChecklistItem ok={webhookConfigured} label={`Webhooks Meta: ${webhookConfigured ? "configurado" : "não configurado"}`} />
            <ChecklistItem ok={webhookEnabled} label={`Webhooks ativo: ${webhookEnabled ? "sim" : "não"}`} />
          </CardContent>
        </Card>

        {/* Checklist operacional */}
        <Card>
          <CardHeader>
            <CardTitle>Checklist operacional</CardTitle>
          </CardHeader>
          <CardContent>
            {CHECKLIST_OPERACIONAL.map((item) => (
              <ChecklistItem key={item} ok label={item} />
            ))}
          </CardContent>
        </Card>

        {/* Taxonomia e não perfilamento */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Taxonomia e não perfilamento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold">O que é permitido:</p>
              <ChecklistItem ok label="Classificar conteúdo das interações (pautas)" />
              <ChecklistItem ok label="Identificar demandas coletivas da cidade" />
              <ChecklistItem ok label="Agrupar posts por assunto público" />
              <ChecklistItem ok label="Contar volume de mobilização por tema" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-700">O que é PROIBIDO:</p>
              <ChecklistItem ok={false} label="Criar score político ou ideológico individual" />
              <ChecklistItem ok={false} label="Inferir voto, religião ou dados sensíveis" />
              <ChecklistItem ok={false} label="Rotular pessoas como 'apoiador' ou 'oposição'" />
              <ChecklistItem ok={false} label="Usar temas para segmentação eleitoral individual" />
            </div>
          </CardContent>
        </Card>

        {/* Relatórios e uso responsável */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Relatórios e uso responsável</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Diretrizes de Exportação:</p>
              <ChecklistItem ok label="Relatórios são para uso interno de planejamento" />
              <ChecklistItem ok label="Exportações não devem conter PII (Telefone/Email)" />
              <ChecklistItem ok label="Toda exportação gera um log de auditoria" />
              <ChecklistItem ok label="Documentos devem conter rodapé de governança" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-700">Usos Proibidos:</p>
              <ChecklistItem ok={false} label="Publicar relatórios com dados de cidadãos" />
              <ChecklistItem ok={false} label="Usar para microtargeting ou disparo em massa" />
              <ChecklistItem ok={false} label="Tentar inferir perfil psicológico ou ideológico" />
              <ChecklistItem ok={false} label="Ignorar a trava de termos proibidos em títulos" />
            </div>
          </CardContent>
        </Card>

        {/* Planos de Ação e Resposta Pública */}
        <Card className="lg:col-span-2 border-primary/20">
          <CardHeader>
            <CardTitle>Planos de Ação e Resposta Pública</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">Objetivo Organizativo:</p>
              <ChecklistItem ok label="Transformar escuta coletiva em tarefas públicas" />
              <ChecklistItem ok label="Planejar posts, plenárias e reuniões presenciais" />
              <ChecklistItem ok label="Encaminhar demandas para órgãos públicos" />
              <ChecklistItem ok label="Manter transparência na resposta às pautas" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-700">Trava de Segurança:</p>
              <ChecklistItem ok label="Bloqueio automático de termos de perfilamento" />
              <ChecklistItem ok label="Geração de incidente em caso de violação de termos" />
              <ChecklistItem ok label="Proibição de tarefas de 'abordagem agressiva'" />
              <ChecklistItem ok label="Foco em ações coletivas, nunca individuais" />
            </div>
          </CardContent>
        </Card>

        {/* Prestação de Contas e Evidências */}
        <Card className="lg:col-span-2 border-green-200 bg-green-50/10">
          <CardHeader>
            <CardTitle className="text-green-800">Prestação de Contas e Evidências</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-green-700">Diretrizes de Registro:</p>
              <ChecklistItem ok label="Registrar apenas o necessário para prestação de contas" />
              <ChecklistItem ok label="Priorizar links públicos e atas de síntese" />
              <ChecklistItem ok label="Focar em resultados e aprendizados coletivos" />
              <ChecklistItem ok label="A evidência deve fortalecer a organização, não vigiar" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-700">Restrições Estritas:</p>
              <ChecklistItem ok label="Proibido incluir PII (telefone/email) em evidências" />
              <ChecklistItem ok label="Bloqueio de termos de segmentação política" />
              <ChecklistItem ok label="Sanitização automática de dados em exportações" />
              <ChecklistItem ok label="Auditoria total de todas as mutações de evidência" />
            </div>
          </CardContent>
        </Card>
 
        {/* Memória Estratégica */}
        <Card className="lg:col-span-2 border-indigo-200 bg-indigo-50/10">
          <CardHeader>
            <CardTitle className="text-indigo-800">Memória Estratégica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-indigo-700">Propósito Organizacional:</p>
              <ChecklistItem ok label="Consolidar aprendizados operacionais da equipe" />
              <ChecklistItem ok label="Identificar padrões de sucesso por tema e território" />
              <ChecklistItem ok label="Guiar decisões baseadas em resultados coletivos" />
              <ChecklistItem ok label="Garantir que o conhecimento permaneça na organização" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-700">Limites de Uso:</p>
              <ChecklistItem ok label="Proibido criar 'perfis de eleitores' na memória" />
              <ChecklistItem ok label="Proibido sugerir microtargeting ou disparo em massa" />
              <ChecklistItem ok label="Obrigatória a sanitização de PII em todas as memórias" />
              <ChecklistItem ok label="Bloqueio de termos de segmentação política sensível" />
            </div>
          </CardContent>
        </Card>

        {/* Webhooks e Recepção Passiva */}
        <Card className="lg:col-span-2 border-blue-200 bg-blue-50/10">
          <CardHeader>
            <CardTitle className="text-blue-800">Webhooks e Recepção Passiva</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-blue-700">Como funciona:</p>
              <ChecklistItem ok label="Webhook recebe sinais públicos autorizados do Meta" />
              <ChecklistItem ok label="Todo evento entra em quarentena para revisão humana" />
              <ChecklistItem ok label="Processamento é manual, iniciado por operador" />
              <ChecklistItem ok label="Assinatura HMAC-SHA256 validada em todo evento" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-700">Garantias de Segurança:</p>
              <ChecklistItem ok label="Webhook NÃO é robô de resposta automática" />
              <ChecklistItem ok label="Nenhum evento gera DM automática" />
              <ChecklistItem ok label="Nenhum evento vira contato sem consentimento" />
              <ChecklistItem ok label="Nenhum evento usado para perfilamento individual" />
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <strong>Aviso:</strong> Eventos proibidos incluem DMs, mensagens privadas, 
              seguidores, dados de público de terceiros, e qualquer payload que exija 
              inferência sensível. Eventos sem assinatura válida são rejeitados e geram incidente.
            </div>
          </CardContent>
        </Card>

        {/* Checklist LGPD */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Checklist LGPD / Campanha</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 sm:grid-cols-2">
            {CHECKLIST_LGPD.map((item) => (
              <ChecklistItem key={item} ok label={item} />
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
