"use client";

import { startTransition, useState } from "react";
import { Download, Eraser, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/mock-data";
import type { PersonWithContact } from "@/lib/types";
import { anonymizeContact } from "@/app/actions";

export function SettingsClient({
  userEmail,
  environment,
  mockMode,
  supabaseConnected,
  latestAuditTest,
  latestMetaError,
  stuckSyncRunsCount,
  latestMetaStatus,
  e2eBypassActive,
  e2eBypassMisconfigured,
  metaConfigured,
  confirmedPeople,
}: {
  userEmail: string | null;
  environment: string;
  mockMode: string;
  supabaseConnected: boolean;
  latestAuditTest: string | null;
  latestMetaError: string | null;
  stuckSyncRunsCount: number;
  latestMetaStatus: string | null;
  e2eBypassActive: boolean;
  e2eBypassMisconfigured: boolean;
  metaConfigured: boolean;
  confirmedPeople: PersonWithContact[];
}) {
  const [purpose, setPurpose] = useState("Organização comunitária, escuta popular e convite manual para reuniões da VR Abandonada.");
  const [privacyUrl, setPrivacyUrl] = useState("https://vrabandonada.example/politica");
  const [consent, setConsent] = useState("Registrar somente quando a pessoa aceitar entrar em grupo, lista ou contato direto.");
  const [removed, setRemoved] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function exportCsv() {
    window.location.href = "/api/contacts/export";
  }

  async function testAuditWrite() {
    const response = await fetch("/api/audit/test", { method: "POST" });
    setFeedback(response.ok ? "audit_log gravado com sucesso." : "Falha ao gravar audit_log.");
  }

  function handleAnonymize(personId: string, username: string) {
    startTransition(async () => {
      const result = await anonymizeContact(personId);
      setRemoved(result.ok ? username : null);
      setFeedback(result.ok ? result.message : result.error);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Boas práticas LGPD/campanha</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-md border bg-background p-4">
            <p className="mb-3 text-sm font-semibold">Segurança operacional</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Supabase conectado</p>
                <p className="text-sm text-muted-foreground">{supabaseConnected ? "Sim" : "Não"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Modo mock</p>
                <p className="text-sm text-muted-foreground">{mockMode}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Ambiente</p>
                <p className="text-sm text-muted-foreground">{environment}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Usuario interno</p>
                <p className="text-sm text-muted-foreground break-all">{userEmail ?? "Sem sessao"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium">Ultimo teste de auditoria</p>
                <p className="text-sm text-muted-foreground">{latestAuditTest ? formatDateTime(latestAuditTest) : "Sem teste registrado"}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-red-800">Producao nao deve usar fallback mock.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-semibold">Status da conexão</p>
              <p className="text-sm text-muted-foreground">{supabaseConnected ? "Supabase configurado" : "Supabase nao configurado"}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-semibold">Usuário logado</p>
              <p className="text-sm text-muted-foreground break-all">{userEmail ?? "Sem sessão"}</p>
            </div>
          </div>
          <Alert>
            <ShieldAlert data-icon="inline-start" />
            <AlertTitle>Uso interno e proporcional</AlertTitle>
            <AlertDescription>
              Use somente dados vindos da API oficial ou registros manuais. Não automatize mensagens, não faça scraping e não crie classificação de voto provável, renda, religião, saúde ou perfil psicológico.
            </AlertDescription>
          </Alert>
          <div className="rounded-md border bg-background p-4">
            <p className="mb-3 text-sm font-semibold">Checklist antes de usar em campanha</p>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li>Conta Instagram profissional/criador conectada.</li>
              <li>Token guardado apenas no servidor.</li>
              <li>Sem scraping.</li>
              <li>Sem envio automático.</li>
              <li>Sem exportar pessoa sem consentimento.</li>
              <li>Respeitar “Não abordar”.</li>
              <li>Registrar auditoria de sincronização e exportação.</li>
            </ul>
          </div>
          <div className="rounded-md border bg-background p-4">
            <p className="mb-3 text-sm font-semibold">Diagnóstico</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" render={<Link href="/operacao" />}>
                Abrir operação
              </Button>
              <Button type="button" variant="outline" render={<Link href="/api/health" />}>
                Abrir healthcheck
              </Button>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <p>Último sync com erro: {latestMetaError ?? "Sem erro registrado"}</p>
              {!metaConfigured ? <p className="text-red-800">Meta ainda não configurada.</p> : null}
              {mockMode === "ativo" ? <p className="text-orange-800">Modo demonstração ativo.</p> : null}
            </div>
          </div>
          <div className="rounded-md border bg-background p-4">
            <p className="mb-3 text-sm font-semibold">Saúde operacional</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Runs presas</p>
                <p className="text-2xl font-black">{stuckSyncRunsCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Último status Meta</p>
                <p className="text-2xl font-black">{latestMetaStatus ?? "Sem sync"}</p>
              </div>
            </div>
            {e2eBypassActive ? (
              <p className="mt-3 text-sm text-orange-800">E2E_BYPASS_AUTH ativo em ambiente de teste.</p>
            ) : null}
            {e2eBypassMisconfigured ? (
              <p className="mt-3 text-sm font-semibold text-red-800">
                E2E_BYPASS_AUTH está ativo fora de NODE_ENV=test. Corrija antes de produção.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purpose">Finalidade da base</Label>
            <Textarea id="purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="privacy">Link da política de privacidade</Label>
            <Input id="privacy" value={privacyUrl} onChange={(event) => setPrivacyUrl(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="consent">Registro de consentimento</Label>
            <Textarea id="consent" value={consent} onChange={(event) => setConsent(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={exportCsv}>
              <Download data-icon="inline-start" />
              Exportar contatos confirmados
            </Button>
            <Button type="button" variant="outline" onClick={testAuditWrite}>
              Testar escrita de audit_log
            </Button>
          </div>
          {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contatos confirmados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button type="button" onClick={exportCsv}>
            <Download data-icon="inline-start" />
            Exportar CSV
          </Button>
          {confirmedPeople.map((person) => (
            <div key={person.id} className="rounded-md border bg-background p-3">
              <p className="font-bold">@{person.username}</p>
              <p className="text-sm text-muted-foreground">{person.contact?.consent_purpose ?? "Consentimento confirmado"}</p>
              <Button
                type="button"
                className="mt-3"
                variant="destructive"
                onClick={() => handleAnonymize(person.id, person.username)}
              >
                <Eraser data-icon="inline-start" />
                Anonimizar/remover contato
              </Button>
            </div>
          ))}
          {removed ? (
            <p className="rounded-md bg-zinc-100 p-3 text-sm">Mock: @{removed} seria anonimizado após confirmação no backend.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
