"use client";

import { useState, useTransition } from "react";
import { PriorityPerson, PersonResponseKind, PersonReferralType } from "@/lib/types";
import { QueueCard } from "./queue-card";
import { QueueList } from "./queue-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/radar/empty-state";
import { 
  Users, 
  PlusCircle, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  HeartHandshake,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { recordPersonResponse, recordPersonReferral } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface QueueClientProps {
  initialQueue: PriorityPerson[];
  operatorName: string;
}

export function QueueClient({ initialQueue, operatorName }: QueueClientProps) {
  const { toast } = useToast();
  const [queue, setQueue] = useState(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);

  const currentPerson = queue[currentIndex];

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({ title: "Fim da fila", description: "Você chegou ao fim da sua fila atual." });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    toast({ title: "Pulando...", description: `Pulando @${currentPerson.username} por enquanto...` });
    handleNext();
  };

  const handleCopyDM = () => {
    if (currentPerson.suggestedMessage) {
      navigator.clipboard.writeText(currentPerson.suggestedMessage);
      toast({ title: "Copiado", description: "DM copiada para a área de transferência!" });
    }
  };

  const handleResponse = async (kind: PersonResponseKind) => {
    startTransition(async () => {
      const result = await recordPersonResponse(currentPerson.id, kind);
      if (result.ok) {
        toast({ title: "Sucesso", description: "Resposta registrada com sucesso!" });
        setShowResponseDialog(false);
        // Remove from queue or move to next
        const newQueue = queue.filter(p => p.id !== currentPerson.id);
        setQueue(newQueue);
        if (currentIndex >= newQueue.length && newQueue.length > 0) {
          setCurrentIndex(newQueue.length - 1);
        }
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleReferral = async (type: PersonReferralType) => {
    startTransition(async () => {
      const result = await recordPersonReferral(currentPerson.id, type);
      if (result.ok) {
        toast({ title: "Sucesso", description: "Encaminhamento registrado!" });
        setShowReferralDialog(false);
        // Usually referral doesn't remove from queue unless it changes status
        // But for "Modo Operador", we might want to move to next
        handleNext();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  if (queue.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <EmptyState
          type="no_data"
          title="Sua fila está vazia"
          description="Você não possui tarefas pendentes atribuídas a você neste momento."
          primaryAction={
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-xs tracking-wider" render={<Link href="/abordagem?filter=sem_responsavel" />}>
              <PlusCircle className="mr-2 h-4 w-4" /> Assumir tarefas disponíveis
            </Button>
          }
          secondaryAction={
            <Button variant="outline" className="font-black uppercase text-xs tracking-wider border-zinc-200" render={<Link href="/dashboard" />}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Voltar ao Painel
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 space-y-12">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Operador Logado</p>
          <h3 className="text-xl font-black text-zinc-900">{operatorName}</h3>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Progresso da Fila</p>
          <p className="text-xl font-black text-zinc-900 tabular-nums">
            {currentIndex + 1} <span className="text-zinc-300">/</span> {queue.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 space-y-8">
          <QueueCard
            person={currentPerson}
            onCopyDM={handleCopyDM}
            onRegisterResponse={() => setShowResponseDialog(true)}
            onReferral={() => setShowReferralDialog(true)}
            onSkip={handleSkip}
            onNext={handleNext}
          />

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className="font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-zinc-900"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            <div className="h-1.5 w-48 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
              />
            </div>
            <Button 
              variant="ghost" 
              onClick={handleNext} 
              disabled={currentIndex === queue.length - 1}
              className="font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-zinc-900"
            >
              Próxima <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <aside className="space-y-8">
          <QueueList 
            tasks={queue} 
            currentIndex={currentIndex} 
            onSelect={setCurrentIndex} 
          />

          {/* Ethical Guardrail */}
          <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-zinc-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Manual do Operador</h4>
            </div>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
              &quot;Contato manual. Revise o texto antes de enviar para garantir tom humanizado. É terminantemente proibido o pedido direto de voto.&quot;
            </p>
          </div>
        </aside>
      </div>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-zinc-950 p-6 text-white">
            <DialogTitle className="text-xl font-black">Registrar Resposta</DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              O que @{currentPerson.username} disse na conversa?
            </DialogDescription>
          </div>
          <div className="p-6 grid grid-cols-1 gap-2">
            {[
              { id: "nao_respondeu", label: "Não respondeu", icon: XCircle, tone: "neutral" },
              { id: "respondeu_bem", label: "Respondeu bem / Topou", icon: CheckCircle2, tone: "success" },
              { id: "pediu_informacoes", label: "Pediu mais informações", icon: HelpCircle, tone: "info" },
              { id: "quer_ir_evento", label: "Quer ir a um evento", icon: Calendar, tone: "info" },
              { id: "quer_ajudar_presencial", label: "Quer voluntariado", icon: HeartHandshake, tone: "info" },
              { id: "quer_conhecer_missao_eluta", label: "Quer Missão ÉLuta", icon: Smartphone, tone: "info" },
              { id: "nao_quer_contato", label: "Não quer ser contatado", icon: ShieldAlert, tone: "danger" },
              { id: "revisar_depois", label: "Revisar conversa depois", icon: MessageSquare, tone: "neutral" },
            ].map((option) => (
              <button
                key={option.id}
                disabled={isPending}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left font-bold text-zinc-700",
                  isPending && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => handleResponse(option.id as PersonResponseKind)}
              >
                <div className="flex items-center gap-3">
                  <option.icon className={cn("h-5 w-5", 
                    option.tone === "success" ? "text-emerald-500" : 
                    option.tone === "info" ? "text-indigo-500" : 
                    option.tone === "danger" ? "text-rose-500" : "text-zinc-400"
                  )} />
                  {option.label}
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Referral Dialog (Simplified) */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-amber-600 p-6 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Encaminhar Pessoa</DialogTitle>
            <DialogDescription className="text-amber-100 font-medium">
              Defina o destino deste contato para aprofundar o vínculo.
            </DialogDescription>
          </div>
          <div className="p-6 grid grid-cols-1 gap-2">
            {[
              { id: "evento_campo", label: "Evento de Campo", icon: Calendar },
              { id: "voluntariado", label: "Voluntariado", icon: HeartHandshake },
              { id: "grupo_lista", label: "Grupo / Lista Comunitária", icon: Users },
              { id: "missao_eluta", label: "App Missão ÉLuta", icon: Smartphone },
            ].map((option) => (
              <button
                key={option.id}
                disabled={isPending}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:border-amber-200 hover:bg-amber-50 transition-all text-left font-bold text-zinc-700"
                onClick={() => handleReferral(option.id as PersonReferralType)}
              >
                <div className="flex items-center gap-3">
                  <option.icon className="h-5 w-5 text-amber-500" />
                  {option.label}
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
