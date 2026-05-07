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
    <div className="space-y-6 mt-8 border-t pt-8 border-slate-200">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
        <h3 className="font-bold text-blue-900 flex items-center gap-2">
          <span className="text-xl">🛡️</span> Visão da Equipe (Operador/Admin)
        </h3>
        <p className="text-sm text-blue-800 mt-1">
          Esta seção não é visível para o público. Use-a para revisar visualmente o recibo antes de publicar e para registrar o planejamento e execução da distribuição manual.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Checklist Visual (Mobile-First)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Card 1:1 abre e carrega no celular</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Card 3:4 abre e carrega no celular</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Texto está legível e contraste está bom</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Números grandes não estão cortados</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Assinatura &quot;Missão ÉLuta&quot; aparece na base</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Nenhum dado pessoal ou comentário bruto foi exposto</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Legenda validada e revisada</label>
            </div>
            
            <div className="pt-4 border-t mt-4 flex gap-4">
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">Prévia 1:1 (Feed)</span>
                <div className="w-[150px] h-[150px] border border-slate-300 rounded-md overflow-hidden relative bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/api/recibo/escuta/card?format=1x1" alt="Prévia 1:1" className="w-full h-full object-cover" />
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => window.open('/api/recibo/escuta/card?format=1x1', '_blank')}>
                  Abrir imagem 1:1
                </Button>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">Prévia 3:4 (Story)</span>
                <div className="w-[150px] h-[200px] border border-slate-300 rounded-md overflow-hidden relative bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/api/recibo/escuta/card?format=3x4" alt="Prévia 3:4" className="w-full h-full object-cover" />
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => window.open('/api/recibo/escuta/card?format=3x4', '_blank')}>
                  Abrir imagem 3:4
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planejar Distribuição</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Canal</label>
                <Select name="channel" defaultValue="whatsapp">
                  <SelectTrigger><SelectValue placeholder="Selecione o canal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram_feed">Instagram Feed</SelectItem>
                    <SelectItem value="instagram_story">Instagram Story</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="reuniao">Reunião Presencial</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato</label>
                <Select name="format" defaultValue="1x1">
                  <SelectTrigger><SelectValue placeholder="Selecione o formato" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x1">Card Quadrado (1:1)</SelectItem>
                    <SelectItem value="3x4">Card Vertical (3:4)</SelectItem>
                    <SelectItem value="texto">Apenas Texto</SelectItem>
                    <SelectItem value="link">Apenas Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas / Grupo alvo (opcional)</label>
                <Input name="notes" placeholder="Ex: Grupo Bairro Centro" />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Registrando..." : "Registrar Planejamento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Distribuição Manual</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma distribuição registrada ainda.</p>
          ) : (
            <div className="space-y-4">
              {logs.filter(l => l.status !== "archived").map((log) => (
                <div key={log.id} className="p-4 border rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={log.status === "shared" ? "default" : "outline"}>
                        {log.status === "shared" ? "Compartilhado" : "Planejado"}
                      </Badge>
                      <span className="font-bold">{log.channel}</span>
                      <span className="text-xs text-muted-foreground uppercase px-2 py-0.5 bg-slate-100 rounded-sm">
                        {log.format}
                      </span>
                    </div>
                    {log.notes && <p className="text-sm text-slate-600">{log.notes}</p>}
                    {log.shared_at && <p className="text-xs text-muted-foreground mt-1">Data: {new Date(log.shared_at).toLocaleString("pt-BR")}</p>}
                    {log.public_url && (
                      <a href={log.public_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                        Ver publicação externa
                      </a>
                    )}
                  </div>
                  
                  {log.status === "planned" && (
                    <form action={(data) => handleShare(log.id, data)} className="flex items-center gap-2">
                      <Input name="publicUrl" placeholder="URL (opcional)" className="h-8 w-[150px] text-xs" />
                      <Button type="submit" size="sm" disabled={loading}>
                        Marcar como compartilhado
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleArchive(log.id)} disabled={loading}>
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
