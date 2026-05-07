import Link from "next/link";
import { Filter, MapPin, MessageSquareText, ShieldAlert, UserRound } from "lucide-react";
import AppShell from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getNeighborhoodListenSummary } from "@/lib/data/neighborhood-listening";
import { requireInternalPageSession } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  if (status === "reviewed") return "Revisada";
  if (status === "forwarded") return "Encaminhada";
  if (status === "archived") return "Arquivada";
  return "Rascunho";
}

export default async function EscutasPage() {
  await requireInternalPageSession("/escutas");
  const summary = await getNeighborhoodListenSummary().catch(() => null);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Escutas"
        title="Revisao de escutas em formato operacional."
        description="No celular, a fila vira cards para leitura rapida, revisao e encaminhamento sem expor dado sensivel."
        actions={<Button nativeButton={false} render={<Link href="/escutas/lote" />}>Digitar fichas</Button>}
      />

      <section className="mb-5 grid gap-3 md:grid-cols-4">
        <KpiCard label="Escutas" value={String(summary?.totalReports ?? 0)} />
        <KpiCard label="Pendentes" value={String(summary?.statusCounts.find((item) => item.status === "novo")?.quantidade ?? 0)} />
        <KpiCard label="Com consentimento" value={String(summary?.consentToContact ?? 0)} />
        <KpiCard label="Bairros" value={String(summary?.topBairros.length ?? 0)} />
      </section>

      <section className="mb-5 rounded-2xl border border-[#e2d7c4] bg-white p-4 shadow-sm">
        <button type="button" className="flex w-full items-center justify-between rounded-xl bg-[#f8f2e6] px-4 py-3 text-left">
          <div>
            <p className="text-sm font-black text-[#0b3326]">Filtrar escutas</p>
            <p className="text-xs text-[#62736b]">Bairro, pauta, status e revisao em um bloco compacto.</p>
          </div>
          <Filter className="h-5 w-5 text-[#0b5a3f]" aria-hidden="true" />
        </button>
        <div className="mt-3 flex flex-wrap gap-2">
          {summary?.topPautas.slice(0, 4).map((item) => (
            <Badge key={item.pauta} variant="outline" className="rounded-full bg-[#fffdf9]">
              {item.pauta}
            </Badge>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        {summary?.recentSanitized.length ? (
          summary.recentSanitized.map((item) => (
            <Card key={item.id} className="rounded-2xl border-[#e2d7c4]">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a26615]">Escuta registrada</p>
                    <h2 className="mt-1 text-lg font-black text-[#0b3326]">{item.pauta}</h2>
                    <p className="text-sm text-[#5e7068]">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge variant="outline">{statusLabel(item.status)}</Badge>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-[#40544b] md:grid-cols-2">
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Bairro / territorio" value={item.bairro} />
                  <InfoRow icon={<UserRound className="h-4 w-4" />} label="Entrevistador" value="Sessao interna" />
                  <InfoRow icon={<MessageSquareText className="h-4 w-4" />} label="Temas principais" value={item.pauta} />
                  <InfoRow icon={<ShieldAlert className="h-4 w-4" />} label="Alerta sensivel" value={item.consentToContact ? "Contato consentido e redigido" : "Sem contato registrado"} />
                </div>

                <div className="mt-4 rounded-xl bg-[#fbf7ef] p-3 text-sm text-[#445851]">{item.relatoPreview}</div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" nativeButton={false} render={<Link href="/escuta/bairro/admin" />} className="h-11 rounded-xl">
                    Revisar
                  </Button>
                  <Button variant="outline" nativeButton={false} render={<Link href="/escutas/lote" />} className="h-11 rounded-xl">
                    Digitar outra
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="rounded-2xl border-dashed border-[#d9ccb8]">
            <CardContent className="p-8 text-center">
              <p className="text-lg font-black text-[#0b3326]">Nenhuma escuta neste recorte.</p>
              <p className="mt-2 text-sm text-[#62736b]">Comece por “Digitar fichas” e revise depois com calma no painel interno.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </AppShell>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-[#e2d7c4]">
      <CardContent className="p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6d3a]">{label}</p>
        <p className="mt-2 text-3xl font-black text-[#0b3326]">{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#efe4d4] bg-white px-3 py-3">
      <span className="mt-0.5 text-[#0b5a3f]">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a6d3a]">{label}</p>
        <p className="mt-1 font-medium text-[#173a2d]">{value}</p>
      </div>
    </div>
  );
}
