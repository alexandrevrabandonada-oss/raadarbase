"use client";

import { useState } from "react";
import Link from "next/link";
import {
  playSynthConfirm,
  playSynthSuccess,
  playSynthSkip,
  playSynthZen,
  playSynthKeypress
} from "@/lib/audio";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronRight,
  Sparkle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GameScenario {
  title: string;
  context: string;
  challenge: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    concretoDelta: number;
    zenDelta: number;
    explanation: string;
  }[];
}

const GAME_SCENARIOS: GameScenario[] = [
  {
    title: "Rodada 1: O Comentário no Instagram",
    context: "Você acabou de logar no Radar de Base. O sistema sinalizou que Júlia Santos comentou em um post recente sobre as péssimas condições das linhas de ônibus de Volta Redonda: 'Finalmente alguém falando disso! Ninguém aguenta mais o atraso do ônibus do Retiro.'",
    challenge: "Como você deve proceder para abordá-la de forma eficiente e alinhada aos guardrails éticos do Radar?",
    options: [
      {
        id: "r1-a",
        text: "Enviar uma mensagem automática privada dizendo: 'Olá Júlia! Vote 99 para mudar o transporte. Acesse nosso site e cadastre seu e-mail!'",
        isCorrect: false,
        concretoDelta: 0,
        zenDelta: -25,
        explanation: "FALHA ÉTICA! O Radar de Base NUNCA realiza disparo automático massivo de mensagens nem pede votos. Toda abordagem deve ser manual, empática e focada em ouvir e coordenar, não em propaganda política agressiva."
      },
      {
        id: "r1-b",
        text: "Copiar a mensagem sugerida pelo Radar, abrir o perfil dela no Instagram, colar a mensagem, adaptá-la manualmente para as palavras dela e, em seguida, clicar em 'Confirmar Envio' no painel.",
        isCorrect: true,
        concretoDelta: 50,
        zenDelta: 50,
        explanation: "CORRETO! O Radar preza por abordagens 100% manuais e contextualizadas. Você garante que a conversa é real ('respiração por dentro') e registra o status no sistema para evitar abordagens duplicadas ('organização no meio')."
      },
      {
        id: "r1-c",
        text: "Ignorar a mensagem sugerida e deixar um comentário público marcando 10 amigos dela no post sobre ônibus.",
        isCorrect: false,
        concretoDelta: 0,
        zenDelta: -10,
        explanation: "INCORRETO! Marcar pessoas aleatoriamente é considerado spam pelas redes sociais e gera ruído negativo para a base de Volta Redonda. O contato privado e atencioso é sempre o melhor caminho."
      }
    ]
  },
  {
    title: "Rodada 2: A Escuta de Rua e a Privacidade",
    context: "Você está em uma ação de escuta de rua na praça do bairro Retiro. Marcos Silva se aproxima, elogia o projeto e diz: 'Eu concordo com tudo o que disseram sobre a saúde, mas por favor, não quero receber nenhuma propaganda, e-mail ou mensagens de celular futuras. Só queria registrar minha reclamação.'",
    challenge: "Qual a atitude correta para registrar o feedback de Marcos no sistema do Radar de Base?",
    options: [
      {
        id: "r2-a",
        text: "Registrar a reclamação dele de forma anônima e salvar seu usuário no sistema sob o status de 'Não Abordar' (Do Not Contact), respeitando seu pedido de privacidade absoluta.",
        isCorrect: true,
        concretoDelta: 50,
        zenDelta: 50,
        explanation: "CORRETO! A privacidade e a vontade das pessoas são absolutas no Radar de Base. Registrar o status de 'Não Abordar' impede que outros militantes o contatem acidentalmente no futuro."
      },
      {
        id: "r2-b",
        text: "Salvar o contato dele na fila normal de abordagens e deixar uma nota dizendo: 'Ele disse que não queria receber mensagens, mas é bem simpático, vale a pena tentar falar com ele semana que vem.'",
        isCorrect: false,
        concretoDelta: 10,
        zenDelta: -40,
        explanation: "VIOLAÇÃO DE PRIVACIDADE! Se alguém diz explicitamente que não quer receber mensagens, insistir é uma invasão ética grave. Isso desgasta a imagem do movimento e desrespeita o cidadão."
      },
      {
        id: "r2-c",
        text: "Não registrar nada no sistema, rasgar o papel da escuta e dizer para ele ir embora porque o projeto só aceita contatos de potenciais apoiadores ativos.",
        isCorrect: false,
        concretoDelta: -20,
        zenDelta: -20,
        explanation: "INCORRETO! Toda opinião popular coletada é valiosa para mapear os problemas da cidade, mesmo de quem não quer receber contatos. O registro anônimo sob o status de Não Abordar deve ser feito para enriquecer o diagnóstico territorial."
      }
    ]
  },
  {
    title: "Rodada 3: O Fechamento Semanal no WhatsApp",
    context: "É domingo à noite. A coordenação da campanha do bairo Aterrado precisa enviar o fechamento de atividades e do ritmo da semana para o grupo geral de coordenação política no WhatsApp. Você gerou o relatório semanal no painel do Radar de Base.",
    challenge: "Como você deve compartilhar essas informações para garantir que os dados fiquem organizados e legíveis no celular?",
    options: [
      {
        id: "r3-a",
        text: "Poderia copiar a tabela HTML inteira do navegador e enviar um arquivo PDF anexado de 15MB no grupo.",
        isCorrect: false,
        concretoDelta: 10,
        zenDelta: -10,
        explanation: "INCORRETO! Ninguém lê PDFs gigantes de relatórios no WhatsApp durante a correria das ações de rua. Precisamos de um formato de consumo rápido e nativo."
      },
      {
        id: "r3-b",
        text: "Copiar o Markdown bruto diretamente da tela (cheio de hashtags, traços de listas e colchetes vazios) e colar no chat do WhatsApp.",
        isCorrect: false,
        concretoDelta: 20,
        zenDelta: 0,
        explanation: "INCORRETO! O Markdown puro fica quebrado e sem formatação adequada no aplicativo de mensagens, gerando ruído e poluição visual nos grupos."
      },
      {
        id: "r3-c",
        text: "Clicar no botão 'Copiar p/ WhatsApp' integrado ao gerador de fechamento, que traduz o Markdown para a sintaxe nativa do app (títulos em negrito caixa alta e marcadores limpos), e colar no grupo.",
        isCorrect: true,
        concretoDelta: 50,
        zenDelta: 50,
        explanation: "CORRETO! Ao usar o formatador dedicado, você garante clareza extrema de leitura no celular, facilitando o ritmo e a coordenação coletiva ('organização no meio')."
      }
    ]
  }
];

export default function GameClient() {
  const [screen, setScreen] = useState<"intro" | "round" | "victory">("intro");
  const [currentRound, setCurrentRound] = useState(0);
  const [concretoScore, setConcretoScore] = useState(0);
  const [zenScore, setZenScore] = useState(50); // Start mid-way for Zen balance
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("radar_audio_muted") === "true";
  });

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    localStorage.setItem("radar_audio_muted", String(nextMuted));
    if (!nextMuted) {
      playSynthConfirm();
    }
  };

  const handleStartGame = () => {
    if (!muted) playSynthConfirm();
    setConcretoScore(0);
    setZenScore(50);
    setCurrentRound(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setScreen("round");
  };

  const handleSelectOption = (optionId: string) => {
    if (isAnswered) return;
    if (!muted) playSynthKeypress();
    setSelectedOptionId(optionId);
  };

  const handleConfirmChoice = () => {
    if (!selectedOptionId || isAnswered) return;

    const roundData = GAME_SCENARIOS[currentRound];
    const option = roundData.options.find(o => o.id === selectedOptionId);
    if (!option) return;

    setIsAnswered(true);
    setIsCorrect(option.isCorrect);
    setExplanationText(option.explanation);

    // Apply Deltas
    setConcretoScore(prev => Math.max(0, prev + option.concretoDelta));
    setZenScore(prev => Math.min(100, Math.max(0, prev + option.zenDelta)));

    if (option.isCorrect) {
      if (!muted) playSynthSuccess();
    } else {
      if (!muted) playSynthSkip();
    }
  };

  const handleNextStep = () => {
    if (!muted) playSynthConfirm();

    if (isCorrect) {
      // Go to next round or end game
      if (currentRound < GAME_SCENARIOS.length - 1) {
        setCurrentRound(prev => prev + 1);
        setSelectedOptionId(null);
        setIsAnswered(false);
      } else {
        setScreen("victory");
        if (!muted) playSynthZen();
      }
    } else {
      // Allow retry
      setSelectedOptionId(null);
      setIsAnswered(false);
    }
  };

  const activeRoundData = GAME_SCENARIOS[currentRound];

  return (
    <div className="min-h-screen bg-[#F4F4F0] dark:bg-[#121210] text-charcoal dark:text-off-white font-sans flex flex-col transition-colors duration-300">

      {/* Brutalist Header Bar */}
      <header className="border-b-4 border-charcoal dark:border-cement bg-burnt-yellow dark:bg-concrete-dark p-4 flex items-center justify-between shadow-[0_4px_0_0_rgba(26,26,26,1)] dark:shadow-[0_4px_0_0_rgba(150,150,150,0.3)]">
        <div className="flex items-center gap-3">
          <Sparkle className="h-6 w-6 text-charcoal dark:text-off-white animate-spin-slow" />
          <span className="font-black tracking-widest text-xs uppercase text-charcoal dark:text-off-white">
            TREINAMENTO OPERACIONAL // CONCRETO ZEN v1.0
          </span>
        </div>
        <button
          onClick={toggleMute}
          className="h-10 w-10 border-2 border-charcoal bg-off-white hover:bg-cement/20 rounded-[2px] flex items-center justify-center transition-all shadow-[2px_2px_0_0_rgba(26,26,26,1)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(26,26,26,1)] text-charcoal"
          title={muted ? "Desmutar Áudio" : "Mutar Áudio"}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">

        {screen === "intro" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Retro ASCII / Hero Box */}
            <div className="border-4 border-charcoal dark:border-cement bg-[#F4F4F0] dark:bg-[#1E1E1B] p-8 text-center shadow-[6px_6px_0_0_rgba(26,26,26,1)] dark:shadow-[6px_6px_0_0_rgba(150,150,150,0.3)] rounded-[2px] space-y-6">
              <div className="font-mono text-center text-xs leading-tight whitespace-pre text-charcoal dark:text-burnt-yellow">
                {`
  ██████╗  █████╗ ██████╗  █████╗ ██████╗     ██████╗ ███████╗    ██████╗  █████╗ ███████╗███████╗
  ██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗    ██╔══██╗██╔════╝    ██╔══██╗██╔══██╗██╔════╝██╔════╝
  ██████╔╝███████║██║  ██║███████║██████╔╝    ██║  ██║█████╗      ██████╔╝███████║███████╗█████╗
  ██╔══██╗██╔══██║██║  ██║██╔══██║██╔══██╗    ██║  ██║██╔══╝      ██╔══██╗██╔══██║╚════██║██╔══╝
  ██║  ██║██║  ██║██████╔╝██║  ██║██║  ██║    ██████╔╝███████╗    ██████╔╝██║  ██║███████║███████╗
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝    ╚═════╝ ╚══════╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
                `}
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-charcoal dark:text-off-white uppercase">
                  Estação Volta Redonda
                </h1>
                <p className="text-sm font-black uppercase tracking-widest text-[#7E7E70] dark:text-cement">
                  Simulador de Abordagem e Ética Operacional
                </p>
              </div>

              <div className="max-w-xl mx-auto text-sm font-medium text-charcoal/80 dark:text-off-white/80 leading-relaxed text-left border-t border-charcoal/20 pt-4 space-y-4">
                <p>
                  Bem-vindo à simulação. O Radar de Base não é um sistema de spam eleitoral ou disparador em massa.
                  Operamos na intersecção entre a <strong>organização sistemática</strong> e o <strong>respeito real</strong> pelas pessoas de Volta Redonda.
                </p>
                <p>
                  Neste mini-game, você guiará as tomadas de decisão de um militante do Radar em 3 situações clássicas.
                  Sua performance será avaliada por duas métricas brutalistas:
                </p>
              </div>

              {/* Status explainers */}
              <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
                <div className="border-2 border-charcoal dark:border-cement bg-off-white dark:bg-concrete-dark/30 p-4 rounded-[2px] text-left">
                  <span className="text-sm font-black text-charcoal dark:text-off-white flex items-center gap-2">
                    🧱 CONCRETO (Operação)
                  </span>
                  <p className="text-xs text-charcoal/70 dark:text-cement font-medium mt-1">
                    Mede sua eficácia em registrar ações, copiar mensagens corretas e manter a fila em movimento organizado.
                  </p>
                </div>
                <div className="border-2 border-charcoal dark:border-cement bg-off-white dark:bg-concrete-dark/30 p-4 rounded-[2px] text-left">
                  <span className="text-sm font-black text-charcoal dark:text-off-white flex items-center gap-2">
                    🧘 ZEN (Ética & Respeito)
                  </span>
                  <p className="text-xs text-charcoal/70 dark:text-cement font-medium mt-1">
                    Mede seu alinhamento com a privacidade alheia, não fazer spam e escutar honestamente cada indivíduo.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleStartGame}
                  className="bg-charcoal text-off-white hover:bg-charcoal/90 dark:bg-burnt-yellow dark:text-charcoal dark:hover:bg-burnt-yellow/90 font-black uppercase text-sm tracking-widest px-12 py-6 rounded-[2px] shadow-[4px_4px_0_0_rgba(126,126,110,0.5)] border-2 border-charcoal transition-all active:translate-y-0.5 active:shadow-[1px_1px_0_0_rgba(126,126,110,0.5)]"
                >
                  Iniciar Simulação <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {screen === "round" && activeRoundData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Scorebar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border-2 border-charcoal dark:border-cement bg-off-white dark:bg-concrete-dark/30 p-3 rounded-[2px] shadow-[2px_2px_0_0_rgba(26,26,26,1)] dark:shadow-[2px_2px_0_0_rgba(150,150,150,0.3)]">
                <span className="block text-[10px] font-black uppercase tracking-widest text-[#7E7E70] dark:text-cement">Fase</span>
                <span className="text-lg font-black">{currentRound + 1} de {GAME_SCENARIOS.length}</span>
              </div>
              <div className="border-2 border-charcoal dark:border-cement bg-off-white dark:bg-concrete-dark/30 p-3 rounded-[2px] shadow-[2px_2px_0_0_rgba(26,26,26,1)] dark:shadow-[2px_2px_0_0_rgba(150,150,150,0.3)]">
                <span className="block text-[10px] font-black uppercase tracking-widest text-[#7E7E70] dark:text-cement">Métrica Concreto</span>
                <span className="text-lg font-black text-charcoal dark:text-off-white flex items-center gap-1">
                  🧱 {concretoScore} pts
                </span>
              </div>
              <div className="border-2 border-charcoal dark:border-cement bg-off-white dark:bg-concrete-dark/30 p-3 rounded-[2px] shadow-[2px_2px_0_0_rgba(26,26,26,1)] dark:shadow-[2px_2px_0_0_rgba(150,150,150,0.3)] col-span-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-[#7E7E70] dark:text-cement">Equilíbrio Zen</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-black shrink-0">🧘 {zenScore}%</span>
                  <Progress value={zenScore} className="h-3 bg-cement/30 flex-1 rounded-[2px]" indicatorClassName="bg-charcoal dark:bg-burnt-yellow" />
                </div>
              </div>
            </div>

            {/* Scenario details */}
            <div className="border-4 border-charcoal dark:border-cement bg-off-white dark:bg-[#1E1E1B] p-6 md:p-8 shadow-[4px_4px_0_0_rgba(26,26,26,1)] dark:shadow-[4px_4px_0_0_rgba(150,150,150,0.3)] rounded-[2px] space-y-6">
              <div className="space-y-2 border-b-2 border-charcoal/10 pb-4">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-charcoal text-off-white dark:bg-[#3E3E3B]">
                  SITUAÇÃO OPERACIONAL
                </span>
                <h2 className="text-2xl font-black text-charcoal dark:text-off-white uppercase pt-2">
                  {activeRoundData.title}
                </h2>
              </div>

              <p className="text-sm md:text-base font-semibold leading-relaxed text-charcoal/90 dark:text-off-white/90">
                {activeRoundData.context}
              </p>

              <div className="p-4 bg-burnt-yellow/10 dark:bg-burnt-yellow/5 border-2 border-dashed border-burnt-yellow/60 rounded-[2px]">
                <p className="text-xs font-black text-burnt-yellow dark:text-burnt-yellow uppercase tracking-widest mb-1">
                  Seu Desafio:
                </p>
                <p className="text-sm font-bold text-charcoal dark:text-off-white">
                  {activeRoundData.challenge}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {activeRoundData.options.map((option) => {
                  const isSelected = selectedOptionId === option.id;

                  return (
                    <button
                      key={option.id}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(option.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-[2px] border-2 transition-all flex items-start gap-4",
                        isSelected
                          ? "border-charcoal dark:border-burnt-yellow bg-burnt-yellow/20 dark:bg-burnt-yellow/10 shadow-[2px_2px_0_0_rgba(26,26,26,1)]"
                          : "border-charcoal/20 dark:border-cement/30 hover:border-charcoal dark:hover:border-cement hover:bg-cement/5",
                        isAnswered && !isSelected && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "h-6 w-6 border-2 border-charcoal rounded-full shrink-0 flex items-center justify-center font-bold text-xs",
                        isSelected ? "bg-charcoal text-off-white dark:bg-burnt-yellow dark:text-charcoal" : "bg-off-white text-charcoal"
                      )}>
                        {option.id.split("-")[1].toUpperCase()}
                      </div>
                      <span className="text-sm font-bold leading-tight">
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Confirm / Feedback Section */}
              <div className="pt-4 border-t-2 border-charcoal/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  {!isAnswered ? (
                    <p className="text-xs font-bold text-[#7E7E70] dark:text-cement italic">
                      Selecione uma das opções acima para analisar a resposta.
                    </p>
                  ) : (
                    <div className="flex items-start gap-3 max-w-xl text-left">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border-2 text-white",
                        isCorrect ? "bg-emerald-500 border-emerald-600" : "bg-rose-500 border-rose-600"
                      )}>
                        {isCorrect ? "✓" : "✗"}
                      </div>
                      <div>
                        <p className={cn(
                          "text-xs font-black uppercase tracking-wider",
                          isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                          {isCorrect ? "Escolha Correta!" : "Erro Operacional / Ético"}
                        </p>
                        <p className="text-xs font-semibold text-charcoal/80 dark:text-off-white/80 mt-0.5 leading-relaxed">
                          {explanationText}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  {!isAnswered ? (
                    <Button
                      onClick={handleConfirmChoice}
                      disabled={!selectedOptionId}
                      className="w-full md:w-auto bg-charcoal text-off-white hover:bg-charcoal/90 dark:bg-burnt-yellow dark:text-charcoal dark:hover:bg-burnt-yellow/90 font-black uppercase text-xs tracking-widest px-8 py-4 rounded-[2px]"
                    >
                      Confirmar Decisão
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextStep}
                      className={cn(
                        "w-full md:w-auto text-off-white font-black uppercase text-xs tracking-widest px-8 py-4 rounded-[2px] flex items-center justify-center gap-2",
                        isCorrect
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-rose-600 hover:bg-rose-700"
                      )}
                    >
                      {isCorrect ? (
                        <>
                          Avançar <ArrowRight className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Tentar Novamente <RotateCcw className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === "victory" && (
          <div className="space-y-8 animate-in zoom-in duration-500 max-w-2xl mx-auto text-center">

            {/* Certificado Brutalista */}
            <div className="border-4 border-charcoal dark:border-cement bg-[#F4F4F0] dark:bg-[#1E1E1B] p-8 md:p-12 shadow-[8px_8px_0_0_rgba(26,26,26,1)] dark:shadow-[8px_8px_0_0_rgba(150,150,150,0.3)] rounded-[2px] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-burnt-yellow text-charcoal border-l-4 border-b-4 border-charcoal font-black flex items-center justify-center rotate-12 translate-x-6 -translate-y-6 shadow-md text-xs uppercase tracking-tighter">
                APROVADO
              </div>

              <div className="h-20 w-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto border-4 border-charcoal shadow-[4px_4px_0_0_rgba(26,26,26,1)]">
                <Award className="h-10 w-10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#7E7E70] dark:text-cement">
                  CERTIFICAÇÃO OFICIAL DE INTEGRANTE
                </span>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-charcoal dark:text-off-white">
                  Operador Concreto Zen
                </h1>
              </div>

              <div className="border-t-2 border-b-2 border-charcoal/10 py-6 space-y-3 max-w-md mx-auto">
                <p className="text-xs font-semibold text-charcoal/80 dark:text-off-white/80 leading-relaxed">
                  Esta credencial virtual valida que você compreendeu os pilares operacionais (Concreto)
                  e os guardrails de respeito, escuta e privacidade (Zen) do Radar de Base de Volta Redonda.
                </p>
                <div className="flex justify-center gap-6 pt-2">
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[#7E7E70] dark:text-cement">🧱 Concreto Final</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">150 / 150 pts</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[#7E7E70] dark:text-cement">🧘 Zen Final</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{zenScore}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleStartGame}
                  variant="outline"
                  className="border-2 border-charcoal text-charcoal hover:bg-cement/10 font-black uppercase text-xs tracking-widest h-12 rounded-[2px]"
                >
                  Jogar Novamente
                </Button>
                <Button
                  nativeButton={false}
                  className="bg-charcoal text-off-white hover:bg-charcoal/90 dark:bg-burnt-yellow dark:text-charcoal dark:hover:bg-burnt-yellow/90 font-black uppercase text-xs tracking-widest h-12 rounded-[2px] px-8"
                  render={<Link href="/treinamento" />}
                >
                  Retornar ao Treinamento <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer Info */}
      <footer className="p-4 border-t-2 border-charcoal/10 dark:border-cement/10 text-center text-[10px] font-bold text-[#7E7E70] dark:text-cement">
        RADAR DE BASE • VOLTA REDONDA — CONCRETO POR FORA. RESPIRAÇÃO POR DENTRO. ORGANIZAÇÃO NO MEIO.
      </footer>
    </div>
  );
}
