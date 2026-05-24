"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, Lightbulb, CheckCircle2 } from "lucide-react";
import { WeeklyRhythmState } from "@/lib/data/weekly-rhythm";
import { Progress } from "@/components/ui/progress";

interface WeeklyClosureProps {
  rhythm: WeeklyRhythmState;
  stats: {
    topThemes: Array<{ theme: string; count: number; rate: number }>;
    territories: Array<{ name: string; stage: string; signals: number }>;
  };
}

export function WeeklyClosure({ rhythm, stats }: WeeklyClosureProps) {
  return (
    <div className="space-y-8">
      {/* Resumo do Ritmo Coletivo */}
      <Card className="bg-indigo-600 border-none text-white shadow-xl shadow-indigo-200">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4 max-w-md">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">Ritmo da Semana</p>
              <h2 className="text-3xl font-black leading-tight">A semana está em construção</h2>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                Temos {rhythm.progress}% do ciclo concluído. Foco em resolver gargalos e garantir que ninguém fique sem resposta.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center bg-white/10 rounded-3xl p-6 min-w-[200px]">
              <span className="text-6xl font-black tracking-tighter">{rhythm.progress}%</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mt-2">Progresso Coletivo</span>
            </div>
          </div>
          
          <div className="mt-8 space-y-2">
            <Progress value={rhythm.progress} className="h-3 bg-indigo-800" indicatorClassName="bg-white" />
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-300">
              <span>Pendências sob controle</span>
              <span>{rhythm.criticalPendencies} parados há 3+ dias</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Temas com maior resposta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Temas com maior resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">Tema</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase">Interações</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase">Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topThemes.map((t) => (
                  <TableRow key={t.theme}>
                    <TableCell className="font-bold">{t.theme}</TableCell>
                    <TableCell className="text-right font-medium">{t.count}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black">
                        {t.rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Territórios em mobilização */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              Territórios pedindo atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase">Bairro</TableHead>
                  <TableHead className="text-[10px] font-black uppercase">Estágio</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase">Sinais</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.territories.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell className="font-bold">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-black uppercase">{t.stage}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{t.signals}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Aprendizados e Ações Recomendadas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-amber-100 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-900">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              Aprendizados da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
               <p className="text-sm font-medium text-amber-900 leading-relaxed italic">
                 &quot;A pauta de transporte público gerou muitas dúvidas sobre horários específicos, sugerimos atualizar o guia de respostas.&quot;
               </p>
               <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mt-2">Relato do Operador</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
               <p className="text-sm font-medium text-amber-900 leading-relaxed italic">
                 &quot;As DMs enviadas no final da tarde tiveram maior taxa de leitura e resposta imediata.&quot;
               </p>
               <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mt-2">Padrão Detectado</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-indigo-900">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              Hora de fechar o ciclo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-medium text-indigo-900">Ações recomendadas para a próxima semana:</p>
            <ul className="space-y-2">
              {[
                "Planejar visita técnica ao bairro Centro (Pauta: Zeladoria)",
                "Atualizar templates de resposta para dúvidas institucionais",
                "Revisar vínculos parados há mais de 5 dias",
                "Gerar relatório consolidado da janela de mobilização"
              ].map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-medium text-indigo-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest h-12 rounded-2xl">
                Iniciar Fechamento Semanal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
