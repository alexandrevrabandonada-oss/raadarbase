import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radar de Base",
  description: "Painel interno da VR Abandonada para escuta popular e gestão ética de contatos.",
  manifest: "/manifest.json",
};

import { TooltipProvider } from "@/components/ui/tooltip";
import { CompletionProvider } from "@/components/radar/completion-provider";
import { PWARegister } from "@/components/pwa-register";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <PWARegister />
        <TooltipProvider>
          <CompletionProvider>
            {children}
          </CompletionProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
