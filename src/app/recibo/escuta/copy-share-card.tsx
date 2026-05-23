"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playSynthSuccess } from "@/lib/audio";
import { useToast } from "@/hooks/use-toast";

type CopyShareCardProps = {
  title: string;
  description: string;
  text: string;
  buttonLabel: string;
};

export function CopyShareCard({ title, description, text, buttonLabel }: CopyShareCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      playSynthSuccess();
      toast({
        title: "Copiado com sucesso! ⚡",
        description: "O texto foi carregado na sua área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar ⚠️",
        description: "Não foi possível copiar o texto automaticamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bloco-concreto dark:border-off-white dark:bg-concrete-dark p-6 flex flex-col justify-between h-full">
      <div>
        <h3 className="text-lg font-black uppercase tracking-wider text-charcoal dark:text-off-white">
          {title}
        </h3>
        <p className="text-xs text-cement dark:text-zinc-400 mt-1 mb-4">
          {description}
        </p>
        <div className="p-4 bg-zinc-900 border-2 border-black dark:border-zinc-700 rounded-[2px] font-mono text-xs break-words whitespace-pre-wrap text-[#E7E0D2] max-h-[180px] overflow-y-auto no-scrollbar mb-4 select-all">
          {text}
        </div>
      </div>
      
      <Button
        onClick={handleCopy}
        variant={copied ? "secondary" : "default"}
        className="w-full mt-auto"
      >
        {copied ? (
          <>
            <Check className="mr-1.5 h-4 w-4" />
            Copiado!
          </>
        ) : (
          <>
            <Copy className="mr-1.5 h-4 w-4" />
            {buttonLabel}
          </>
        )}
      </Button>
    </div>
  );
}
