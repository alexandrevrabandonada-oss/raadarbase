"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ClimateCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={copy}>
      {copied ? "Copiado" : "Copiar pedido"}
    </Button>
  );
}
