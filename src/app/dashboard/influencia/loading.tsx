import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function InfluenceLoading() {
  return <div className="grid gap-4 p-6 md:grid-cols-3" aria-label="Carregando Radar de Influência">{Array.from({ length: 6 }, (_, index) => <Card key={index}><CardHeader><div className="h-4 w-32 rounded bg-muted/30" /></CardHeader><CardContent><div className="h-12 rounded bg-muted/20" /></CardContent></Card>)}</div>;
}

