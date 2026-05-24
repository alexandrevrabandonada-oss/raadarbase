"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateImportBatch, type PersonImportPreview, type PersonImportRow } from "@/lib/data/import";
import { executePersonImportBatch } from "@/app/actions";

export function ImportClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("lote");
  
  // Single registration state
  const [singleRow, setSingleRow] = useState<PersonImportRow>({ username: "", status: "novo", temperature: "frio" });
  
  // Bulk state
  const [batchText, setBatchText] = useState("");
  const [previews, setPreviews] = useState<PersonImportPreview[] | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function parseBatchText(): PersonImportRow[] {
    if (!batchText.trim()) return [];
    
    return batchText.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Simple heuristic for TSV or CSV
        const delimiter = line.includes("\t") ? "\t" : ",";
        const parts = line.split(delimiter).map(p => p.trim());
        
        return {
          username: parts[0] || "",
          displayName: parts[1] || undefined,
          theme: parts[2] || undefined,
          status: parts[3] || undefined,
          temperature: parts[4] || undefined,
          reason: parts[5] || undefined,
        };
      });
  }

  async function handleValidateBatch() {
    setIsValidating(true);
    setFeedback(null);
    try {
      const rows = parseBatchText();
      if (rows.length === 0) {
        setFeedback({ type: "error", text: "Nenhum dado encontrado para validar." });
        return;
      }
      const results = await validateImportBatch(rows);
      setPreviews(results);
    } catch (e) {
      setFeedback({ type: "error", text: e instanceof Error ? e.message : "Erro ao validar." });
    } finally {
      setIsValidating(false);
    }
  }

  async function handleValidateSingle() {
    setIsValidating(true);
    setFeedback(null);
    try {
      if (!singleRow.username.trim()) {
        setFeedback({ type: "error", text: "Username é obrigatório." });
        return;
      }
      const results = await validateImportBatch([singleRow]);
      setPreviews(results);
    } catch (e) {
      setFeedback({ type: "error", text: e instanceof Error ? e.message : "Erro ao validar." });
    } finally {
      setIsValidating(false);
    }
  }

  function handleImport() {
    if (!previews || previews.length === 0) return;
    
    startTransition(async () => {
      const result = await executePersonImportBatch(previews);
      if (result.ok) {
        setFeedback({ type: "success", text: result.message });
        setPreviews(null);
        setBatchText("");
        setSingleRow({ username: "", status: "novo", temperature: "frio" });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: result.error });
      }
    });
  }

  const validCount = previews?.filter(p => !p.hasErrors).length || 0;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lote">Importação em Lote</TabsTrigger>
          <TabsTrigger value="individual">Cadastro Individual</TabsTrigger>
        </TabsList>

        <TabsContent value="lote" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Colar Dados (CSV / Excel)</CardTitle>
              <CardDescription>
                Cole os dados separados por vírgula ou tabulação (copiados do Excel/Sheets). 
                <br/>
                <strong>Ordem das colunas:</strong> Username, Nome, Tema, Status (novo/responder), Temperatura (quente/morno/frio), Motivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
                placeholder="Exemplo: @usuario_silva, João Silva, habitação, responder, quente, Denunciou goteira"
                className="min-h-[200px] font-mono text-xs"
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleValidateBatch} disabled={isValidating || !batchText.trim()} variant="secondary">
                {isValidating ? "Validando..." : "Validar Dados"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Username Instagram *</label>
                  <Input 
                    placeholder="@username ou link" 
                    value={singleRow.username}
                    onChange={e => setSingleRow({...singleRow, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nome de Exibição</label>
                  <Input 
                    placeholder="Opcional" 
                    value={singleRow.displayName || ""}
                    onChange={e => setSingleRow({...singleRow, displayName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                  <select 
                    className="w-full rounded-md border border-input px-3 py-2 text-sm"
                    value={singleRow.status}
                    onChange={e => setSingleRow({...singleRow, status: e.target.value})}
                  >
                    <option value="novo">Apenas Observar (Novo)</option>
                    <option value="responder">Para Abordar (Responder)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Temperatura</label>
                  <select 
                    className="w-full rounded-md border border-input px-3 py-2 text-sm"
                    value={singleRow.temperature}
                    onChange={e => setSingleRow({...singleRow, temperature: e.target.value})}
                  >
                    <option value="quente">Quente</option>
                    <option value="morno">Morno</option>
                    <option value="frio">Frio</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Motivo / Notas</label>
                  <Input 
                    placeholder="Por que estamos cadastrando essa pessoa?" 
                    value={singleRow.reason || ""}
                    onChange={e => setSingleRow({...singleRow, reason: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleValidateSingle} disabled={isValidating || !singleRow.username.trim()} variant="secondary">
                {isValidating ? "Validando..." : "Validar Contato"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {feedback && (
        <div className={`p-4 rounded-md text-sm ${feedback.type === "error" ? "bg-red-50 text-red-900 border border-red-200" : "bg-emerald-50 text-emerald-900 border border-emerald-200"}`}>
          {feedback.text}
        </div>
      )}

      {previews && (
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
            <CardDescription>
              {previews.length} registros analisados. {validCount} prontos para salvar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Ação</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Mensagens</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previews.map((p, i) => (
                    <tr key={i} className={p.hasErrors ? "bg-red-50/50" : p.isDuplicate ? "bg-yellow-50/50" : ""}>
                      <td className="px-4 py-3 font-mono">@{p.username}</td>
                      <td className="px-4 py-3">
                        {p.hasErrors ? (
                          <Badge variant="destructive">Bloqueado</Badge>
                        ) : p.isDuplicate ? (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Atualizar</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">Inserir</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.status}
                        {p.temperature === "quente" && <span className="ml-2 text-xs text-orange-600 font-bold">🔥 Quente</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {p.validationErrors.map((err, j) => <div key={j} className="text-red-600">- {err}</div>)}
                        {!p.hasErrors && p.isDuplicate && <div>Registro existente será atualizado.</div>}
                        {p.status === "responder" && !p.hasErrors && <div>Criará tarefa de abordagem.</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button variant="ghost" onClick={() => setPreviews(null)} disabled={isPending}>Cancelar</Button>
            <Button onClick={handleImport} disabled={isPending || validCount === 0}>
              {isPending ? "Salvando..." : `Confirmar ${validCount} importações`}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
