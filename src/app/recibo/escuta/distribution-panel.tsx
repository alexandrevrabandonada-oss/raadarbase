"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  type PublicReceiptDistributionLog, 
  createReceiptDistributionLogAction, 
  markReceiptDistributionSharedAction, 
  archiveReceiptDistributionAction 
} from "@/lib/data/public-receipt-distribution";

export function DistributionPanel({ logs }: { logs: PublicReceiptDistributionLog[] }) {
  const [loading, setLoading] = useState(false);

  const handleCreate = async (formData: FormData) => {
    setLoading(true);
    try {
      const channel = formData.get("channel") as PublicReceiptDistributionLog["channel"];
      const format = formData.get("format") as PublicReceiptDistributionLog["format"];
      const notes = formData.get("notes") as string;
      await createReceiptDistributionLogAction({ channel, format, notes });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (id: string, formData: FormData) => {
    setLoading(true);
    try {
      const publicUrl = formData.get("publicUrl") as string;
      await markReceiptDistributionSharedAction(id, { publicUrl });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    setLoading(true);
    try {
      await archiveReceiptDistributionAction(id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 mt-8 border-t-2 border-black pt-8">
      {/* Aviso de Visão da Equipe Brutal */}
      <div className="border-2 border-black bg-[#FFF7CD] text-charcoal shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-5 rounded-[2px]">
        <h3 className="font-black uppercase tracking-wider text-xs flex items-center gap-2">
          <span>🛡️</span> Visão da Equipe (Operador / Admin)
        </h3>
        <p className="text-xs text-cement mt-1.5">
          Esta seção é restrita aos operadores da campanha. Use-a para revisar visualmente o recibo antes de publicar e registrar a distribuição manual efetuada nos canais.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Checklist de Validação Visual */}
        <Card className="bloco-concreto">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wider text-charcoal">Checklist Visual (Mobile-First)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5 text-xs text-charcoal">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input type="checkbox" className="rounded-[2px] border-2 border-black accent-burnt-yellow size-3.5" />
                Card 1:1 abre e carrega no celular
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input type="checkbox" className="rounded-[2px] border-2 border-black accent-burnt-yellow size-3.5" />
                Card 3:4 abre e carrega no celular
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input type="checkbox" className="rounded-[2px] border-2 border-black accent-burnt-yellow size-3.5" />
                Texto legível e contraste adequado
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input type="checkbox" className="rounded-[2px] border-2 border-black accent-burnt-yellow size-3.5" />
                Números em destaque não cortam em telas pequenas
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input type="checkbox" className="rounded-[2px] border-2 border-black accent-burnt-yellow size-3.5" />
                Assinatura &quot;Missão ÉLuta&quot; visível na base
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input type="checkbox" className="rounded-[2px] border-2 border-black accent-burnt-yellow size-3.5" />
                Sem exposição de dados pessoais ou relatos brutos
              </label>
            </div>
            
            <div className="pt-4 border-t border-cement/20 mt-4 flex gap-4">
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase text-cement">Prévia 1:1 (Feed)</span>
                <div className="w-[150px] h-[150px] border-2 border-black rounded-[2px] overflow-hidden relative bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/api/recibo/escuta/card?format=1x1" alt="Prévia 1:1" className="w-full h-full object-cover" />
                </div>
                <Button variant="outline" size="xs" className="w-full border-black rounded-[2px]" onClick={() => window.open('/api/recibo/escuta/card?format=1x1', '_blank')}>
                  Abrir Feed 1:1
                </Button>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase text-cement">Prévia 3:4 (Story)</span>
                <div className="w-[150px] h-[180px] border-2 border-black rounded-[2px] overflow-hidden relative bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/api/recibo/escuta/card?format=3x4" alt="Prévia 3:4" className="w-full h-full object-cover" />
                </div>
                <Button variant="outline" size="xs" className="w-full border-black rounded-[2px]" onClick={() => window.open('/api/recibo/escuta/card?format=3x4', '_blank')}>
                  Abrir Story 3:4
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planejar Distribuição */}
        <Card className="bloco-concreto">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wider text-charcoal">Planejar Distribuição</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-cement">Canal</label>
                <Select name="channel" defaultValue="whatsapp">
                  <SelectTrigger className="border-2 border-black rounded-[2px] bg-zinc-50 dark:bg-zinc-800 text-xs">
                    <SelectValue placeholder="Selecione o canal" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black bg-off-white text-charcoal">
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram_feed">Instagram Feed</SelectItem>
                    <SelectItem value="instagram_story">Instagram Story</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="reuniao">Reunião Presencial</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-cement">Formato</label>
                <Select name="format" defaultValue="1x1">
                  <SelectTrigger className="border-2 border-black rounded-[2px] bg-zinc-50 dark:bg-zinc-800 text-xs">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black bg-off-white text-charcoal">
                    <SelectItem value="1x1">Card Quadrado (1:1)</SelectItem>
                    <SelectItem value="3x4">Card Vertical (3:4)</SelectItem>
                    <SelectItem value="texto">Apenas Texto</SelectItem>
                    <SelectItem value="link">Apenas Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-cement">Notas / Grupo alvo (opcional)</label>
                <Input name="notes" placeholder="Ex: Grupo Bairro Centro" className="border-2 border-black rounded-[2px] bg-zinc-50 dark:bg-zinc-800 h-9 text-xs" />
              </div>

              <Button type="submit" disabled={loading} className="w-full border-black rounded-[2px] mt-2">
                {loading ? "Registrando..." : "Registrar Planejamento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Logs de Distribuição */}
      <Card className="bloco-concreto">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-wider text-charcoal">Logs de Distribuição Manual</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-xs text-cement italic">Nenhuma distribuição registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {logs.filter(l => l.status !== "archived").map((log) => (
                <div key={log.id} className="p-4 border-2 border-black rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={log.status === "shared" ? "default" : "outline"} className="border-black uppercase font-mono text-[9px]">
                        {log.status === "shared" ? "Compartilhado" : "Planejado"}
                      </Badge>
                      <span className="font-black text-xs uppercase tracking-wider text-charcoal dark:text-off-white">{log.channel}</span>
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 border border-black bg-zinc-200 dark:bg-zinc-700 text-charcoal dark:text-off-white rounded-[2px]">
                        {log.format}
                      </span>
                    </div>
                    {log.notes && <p className="text-xs text-cement dark:text-zinc-300 mt-1">{log.notes}</p>}
                    {log.shared_at && <p className="text-[9px] text-cement/75 mt-0.5">Sincronizado em: {new Date(log.shared_at).toLocaleString("pt-BR")}</p>}
                    {log.public_url && (
                      <a href={log.public_url} target="_blank" rel="noreferrer" className="text-[10px] text-burnt-yellow hover:underline mt-1.5 block font-bold">
                        Ver publicação externa →
                      </a>
                    )}
                  </div>
                  
                  {log.status === "planned" && (
                    <form action={(data) => handleShare(log.id, data)} className="flex items-center gap-2 flex-wrap">
                      <Input name="publicUrl" placeholder="URL da postagem (opcional)" className="h-8 w-[160px] text-xs border-2 border-black rounded-[2px] bg-white dark:bg-zinc-900" />
                      <Button type="submit" size="xs" disabled={loading} className="border-black rounded-[2px]">
                        Compartilhado
                      </Button>
                      <Button type="button" variant="ghost" size="xs" onClick={() => handleArchive(log.id)} disabled={loading} className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-[2px]">
                        Arquivar
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
