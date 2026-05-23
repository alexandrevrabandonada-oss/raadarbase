import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VolunteerApplicationSuccessPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card className="bloco-concreto shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wider text-charcoal flex items-center gap-2">
              Inscrição Recebida ✅
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs font-bold text-charcoal">
              Sua inscrição entrou na fila de revisão da equipe. Ela não cria um registro ativo de imediato nem gera abordagens automatizadas.
            </p>
            <p className="text-xs text-cement">
              Nossos coordenadores farão a revisão das informações enviadas. Não há garantia de retorno ou aprovação imediata.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Button nativeButton={false} variant="default" render={<Link href="/recibo/escuta" />} className="rounded-[2px] border-black">
                Ver recibo da escuta
              </Button>
              <Button nativeButton={false} variant="outline" render={<Link href="/escuta/bairro" />} className="rounded-[2px] border-black">
                Participar da escuta por bairro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
