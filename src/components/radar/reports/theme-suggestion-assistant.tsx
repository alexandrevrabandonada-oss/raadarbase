"use client";

import * as React from "react";
import { 
  Tags, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  RefreshCw,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updatePersonThemeAction } from "@/app/actions";
import { suggestThemeForPerson } from "@/lib/data/data-quality";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ThemeSuggestionAssistant({ 
  peopleWithoutTheme 
}: { 
  peopleWithoutTheme: { id: string, username: string, displayName?: string | null }[] 
}) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const person = peopleWithoutTheme[activeIdx];

  const loadSuggestions = React.useCallback(async () => {
    if (!person) return;
    setIsLoading(true);
    try {
      const data = await suggestThemeForPerson(person.id);
      setSuggestions(data);
    } catch (error) {
      console.error("Erro ao carregar sugestões", error);
    } finally {
      setIsLoading(false);
    }
  }, [person]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSuggestions();
  }, [loadSuggestions]);

  const handleApplyTheme = (theme: string) => {
    if (!person) return;
    startTransition(async () => {
      const result = await updatePersonThemeAction(person.id, [theme]);
      if (result.ok) {
        toast({ title: "Tema aplicado", description: `O tema '${theme}' foi salvo para @${person.username}.` });
        if (activeIdx < peopleWithoutTheme.length - 1) {
          setActiveIdx(prev => prev + 1);
        } else {
          toast({ title: "Concluido", description: "Todos os perfis selecionados foram revisados." });
        }
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleSkip = () => {
    if (activeIdx < peopleWithoutTheme.length - 1) {
      setActiveIdx(prev => prev + 1);
    }
  };

  if (!person) return (
    <Card className="border-dashed border-zinc-200 bg-zinc-50">
      <CardContent className="py-12 text-center text-zinc-400">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-xs font-bold uppercase tracking-widest">Nenhuma pessoa sem tema na fila.</p>
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-none shadow-xl ring-1 ring-zinc-200 overflow-hidden bg-white">
      <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black tracking-tight text-indigo-900 uppercase">
                Assistente de Temas
              </CardTitle>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                Perfil {activeIdx + 1} de {peopleWithoutTheme.length}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={loadSuggestions} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
              <Tags className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 uppercase">@{person.username}</h3>
            <p className="text-sm font-bold text-zinc-500">{person.displayName || "Sem nome"}</p>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-center">Temas Sugeridos pelo Radar</p>
            
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 italic text-xs">
                Não conseguimos inferir temas das interações recentes.
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {suggestions.map((theme) => (
                  <Button 
                    key={theme}
                    variant="outline"
                    className="border-indigo-100 bg-indigo-50/20 hover:bg-indigo-600 hover:text-white transition-all rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest"
                    onClick={() => handleApplyTheme(theme)}
                    disabled={isPending}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    {theme}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-100 flex items-center justify-center gap-4">
            <Button 
              variant="ghost" 
              className="font-black uppercase text-[10px] tracking-widest h-10 px-6 text-zinc-400"
              onClick={handleSkip}
            >
              Pular este perfil
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
