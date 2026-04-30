/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Camera, 
  Link as LinkIcon, 
  MessageSquare,
  Loader2,
  X
} from "lucide-react";
import { createActionEvidenceAction, removeActionEvidenceAction } from "../../execution-actions";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/mock-data";

interface EvidenceListProps {
  planId: string;
  itemId: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  initialEvidence: any[];
}

export function EvidenceList({ planId, itemId, initialEvidence }: EvidenceListProps) {
  const { toast } = useToast();
  const [evidence, setEvidence] = useState(initialEvidence);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("nota_interna");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createActionEvidenceAction(planId, {
        action_plan_item_id: itemId,
        title,
        description,
        url: url || null,
        evidence_type: type as any
      });

      if (result.ok) {
        toast({ title: "Sucesso", description: "Evidência registrada." });
        setIsAdding(false);
        // Em um app real, recarregaríamos via server actions, aqui vamos atualizar o estado local para UX
        setEvidence([{ 
          id: Math.random().toString(), 
          title, 
          description, 
          url, 
          evidence_type: type, 
          created_at: new Date().toISOString() 
        }, ...evidence]);
        
        setTitle("");
        setDescription("");
        setUrl("");
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Deseja realmente remover esta evidência?")) return;
    
    try {
      const result = await removeActionEvidenceAction(planId, itemId, id);
      if (result.ok) {
        setEvidence(evidence.filter(e => e.id !== id));
        toast({ title: "Removido", description: "Evidência removida com sucesso." });
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'link_publico': return <LinkIcon className="h-4 w-4" />;
      case 'foto_registro': return <Camera className="h-4 w-4" />;
      case 'ata_reuniao': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {!isAdding ? (
        <Button onClick={() => setIsAdding(true)} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" /> Adicionar Evidência
        </Button>
      ) : (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold">Nova Evidência</h4>
              <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <Label htmlFor="type" className="text-xs">Tipo</Label>
                <select 
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-3"
                >
                  <option value="nota_interna">Nota Interna</option>
                  <option value="link_publico">Link Público</option>
                  <option value="print_publico">Print Público</option>
                  <option value="foto_registro">Foto de Registro</option>
                  <option value="ata_reuniao">Ata de Reunião</option>
                  <option value="encaminhamento">Encaminhamento</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="title" className="text-xs">Título / Resumo</Label>
                <Input 
                  id="title" 
                  size={32}
                  className="h-8 text-xs" 
                  placeholder="Ex: Foto da plenária na praça" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-xs">Descrição (Opcional)</Label>
                <Textarea 
                  id="description" 
                  className="text-xs min-h-[60px]" 
                  placeholder="Detalhes sobre esta evidência..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="url" className="text-xs">Link Externo (Opcional)</Label>
                <Input 
                  id="url" 
                  className="h-8 text-xs" 
                  placeholder="https://..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <Button type="submit" size="sm" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Evidência"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {evidence.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm italic">
            Nenhuma evidência registrada.
          </div>
        ) : (
          evidence.map((e) => (
            <div key={e.id} className="flex items-start gap-3 p-3 bg-white border rounded-lg group shadow-sm">
              <div className="mt-1 text-blue-600">
                {getIcon(e.evidence_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h5 className="text-sm font-semibold truncate">{e.title}</h5>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {e.url && (
                      <a 
                        href={e.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleRemove(e.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {e.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                )}
                <div className="text-[10px] text-muted-foreground mt-2">
                  {formatDateTime(e.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
