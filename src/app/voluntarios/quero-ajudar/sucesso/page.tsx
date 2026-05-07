import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VolunteerApplicationSuccessPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Inscrição recebida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Sua inscrição entrou na fila de revisão da equipe. Ela não cria voluntário ativo automaticamente e não gera abordagem automática.</p>
            <p className="text-sm text-muted-foreground">Uma pessoa da equipe poderá revisar as informações. Não há promessa de retorno imediato.</p>
            <div className="flex flex-wrap gap-3">
              <Button nativeButton={false} render={<Link href="/recibo/escuta" />}>
                Ver recibo da escuta
              </Button>
              <Button nativeButton={false} variant="outline" render={<Link href="/escuta/bairro" />}>
                Participar da escuta por bairro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
