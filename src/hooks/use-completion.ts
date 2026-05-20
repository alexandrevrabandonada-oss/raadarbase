import * as React from "react";
import { useToast } from "./use-toast";

export type CompletionType = 
  | "response_recorded"
  | "referral_done"
  | "dnc_respected"
  | "day_closed"
  | "event_closed"
  | "training_phase_done"
  | "training_finished";

const COMPLETION_MESSAGES: Record<CompletionType, { title: string; description: string }> = {
  response_recorded: {
    title: "Vínculo atualizado com segurança",
    description: "A resposta foi registrada e o fluxo de conversa avançou."
  },
  referral_done: {
    title: "Encaminhamento concluído",
    description: "Ninguém ficou perdido. O cidadão agora tem um próximo passo claro."
  },
  dnc_respected: {
    title: "Privacidade respeitada",
    description: "O pedido de não contato foi processado e a base está protegida."
  },
  day_closed: {
    title: "Dia organizado",
    description: "Pendências críticas controladas. Bom descanso!"
  },
  event_closed: {
    title: "Evento finalizado com sucesso",
    description: "Os resultados de campo foram integrados à inteligência territorial."
  },
  training_phase_done: {
    title: "Fase concluída",
    description: "Você dominou mais um processo operacional do Radar."
  },
  training_finished: {
    title: "Operador Capacitado",
    description: "Trilha concluída. Você está pronto para atuar na base real."
  }
};

export interface CompletionContextType {
  showCompletion: (type: CompletionType) => void;
  activeCompletion: CompletionType | null;
  closeCompletion: () => void;
}

export const CompletionContext = React.createContext<CompletionContextType | undefined>(undefined);

export function useCompletion() {
  const { toast } = useToast();
  const context = React.useContext(CompletionContext);

  const showCompletion = (type: CompletionType) => {
    if (context) {
      context.showCompletion(type);
    } else {
      // Fallback para toast caso esteja fora do Provider
      const message = COMPLETION_MESSAGES[type];
      toast({
        title: message.title,
        description: message.description,
        variant: "default"
      });
    }
  };

  return { showCompletion };
}
