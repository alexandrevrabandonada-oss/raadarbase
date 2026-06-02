import type { Metadata, Viewport } from "next";
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
  applicationName: "Radar de Base",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Radar de Base",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F2A900",
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
