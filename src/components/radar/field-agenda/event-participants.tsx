"use client";

import * as React from "react";
import { 
  Users, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Clock,
  MoreVertical,
  UserPlus
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import type { PersonReferral, PersonReferralStatus } from "@/lib/types";
import { updatePersonReferralStatus } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { PersonQuickSheet } from "@/components/radar/person-quick-sheet";
import { listPriorityPeople } from "@/lib/data/people-priority";
import type { PriorityPerson } from "@/lib/types";

interface EventParticipantsProps {
  eventId: string;
  initialParticipants: PersonReferral[];
  manageable?: boolean;
}

export function EventParticipants({ eventId, initialParticipants, manageable }: EventParticipantsProps) {
  const [participants, setParticipants] = React.useState(initialParticipants);
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();
  
  const [selectedPersonId, setSelectedPersonId] = React.useState<string | null>(null);
  const [quickSheetOpen, setQuickSheetOpen] = React.useState(false);
  const [priorityPeople, setPriorityPeople] = React.useState<PriorityPerson[]>([]);

  React.useEffect(() => {
    async function loadPeople() {
      const people = await listPriorityPeople();
      setPriorityPeople(people);
    }
    loadPeople();
  }, []);

  const handleUpdateStatus = (referralId: string, personId: string, newStatus: PersonReferralStatus) => {
    startTransition(async () => {
      const result = await updatePersonReferralStatus(referralId, personId, newStatus);
      if (result.ok) {
        toast({ title: "Status atualizado", description: result.message });
        setParticipants(prev => prev.map(p => p.id === referralId ? { ...p, status: newStatus } : p));
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  const selectedPerson = priorityPeople.find(p => p.id === selectedPersonId) || null;

  const getStatusBadge = (status: PersonReferralStatus) => {
    switch (status) {
      case "confirmou": return <Badge className="bg-moss border-charcoal text-off-white">Confirmado</Badge>;
      case "compareceu": return <Badge className="bg-slate-blue border-charcoal text-off-white">Presente</Badge>;
      case "ajudou": return <Badge className="bg-burnt-yellow border-charcoal text-charcoal shadow-[1px_1px_0px_0px_rgba(11,11,11,1)]">Ajudou</Badge>;
      case "recusou": return <Badge variant="destructive">Recusou</Badge>;
      case "convidado": return <Badge variant="outline" className="border-cement text-cement bg-transparent">Convidado</Badge>;
      case "interessado": return <Badge className="border-charcoal bg-charcoal text-burnt-yellow">Interessado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Pessoas Interessadas / Convidadas
        </h3>
        <Badge variant="outline" className="font-bold">{participants.length}</Badge>
      </div>

      {participants.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-cement rounded-[4px] bg-charcoal/5">
          <p className="text-sm text-zinc-600 italic font-bold">Nenhum interessado registrado para esta ação ainda.</p>
          <p className="text-[10px] text-zinc-500 mt-2 uppercase font-black tracking-widest">Encaminhe pessoas via Ficha Rápida no Kanban</p>
        </div>
      ) : (
        <div className="border-2 border-charcoal rounded-[4px] overflow-hidden bg-off-white shadow-[4px_4px_0px_0px_rgba(28,28,26,1)]">
          <Table>
            <TableHeader className="bg-charcoal/10 border-b-2 border-charcoal">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Participante</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Próxima Ação</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p) => {
                const personData = p.metadata?.person;
                return (
                  <TableRow key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-900">{personData?.display_name || "Sem nome"}</span>
                        <span className="text-[10px] font-bold text-zinc-400">@{personData?.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(p.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.status === "interessado" || p.status === "convidado" ? (
                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Confirmar presença
                          </span>
                        ) : p.status === "confirmou" ? (
                          <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Aguardar evento
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400">Ação finalizada</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48 font-bold">
                          <DropdownMenuItem onClick={() => {
                            setSelectedPersonId(p.personId);
                            setQuickSheetOpen(true);
                          }}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Abrir Ficha Rápida
                          </DropdownMenuItem>
                          
                          {manageable && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-emerald-600"
                                onClick={() => handleUpdateStatus(p.id, p.personId, "confirmou")}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" /> Confirmar Ida
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-blue-600"
                                onClick={() => handleUpdateStatus(p.id, p.personId, "compareceu")}
                              >
                                <Users className="mr-2 h-4 w-4" /> Marcar Presença
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-indigo-600"
                                onClick={() => handleUpdateStatus(p.id, p.personId, "ajudou")}
                              >
                                <UserPlus className="mr-2 h-4 w-4" /> Ajudou na Ação
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-rose-600"
                                onClick={() => handleUpdateStatus(p.id, p.personId, "recusou")}
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Cancelar/Faltou
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedPerson && (
        <PersonQuickSheet 
          person={selectedPerson}
          open={quickSheetOpen}
          onOpenChange={setQuickSheetOpen}
        />
      )}
    </div>
  );
}
