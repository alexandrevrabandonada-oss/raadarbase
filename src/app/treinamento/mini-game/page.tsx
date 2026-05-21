import { Metadata } from "next";
import GameClient from "./game-client";

export const metadata: Metadata = {
  title: "Simulador de Campo: Estação Volta Redonda | Radar de Base",
  description: "Mini-game interativo de orientação para novos operadores do Radar de Base.",
};

export default function GamePage() {
  return <GameClient />;
}
