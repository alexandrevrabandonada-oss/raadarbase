import TrainingClient from "./training-client";
import AppShell from "@/components/app-shell";

export const metadata = {
  title: "Treinamento do Operador | Radar de Base",
  description: "Aprenda a operar o Radar de Base com segurança e ética.",
};

export default function TrainingPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50/50">
        <TrainingClient />
      </div>
    </AppShell>
  );
}
