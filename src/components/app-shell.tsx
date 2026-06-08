import { getInternalSession } from "@/lib/supabase/auth";
import { USE_MOCKS } from "@/lib/config";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { PwaInstallCta } from "@/components/pwa-install-cta";
import { getAdventureProgress } from "@/lib/data/adventure-progress";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const [user, adventureProgress] = await Promise.all([
    getInternalSession(),
    getAdventureProgress(),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Mobile Header */}
      <header className="radar-paper sticky top-0 z-40 flex h-16 items-center justify-between border-b-2 border-cement px-4 xl:hidden">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-[2px] border-2 border-charcoal bg-burnt-yellow overflow-hidden shadow-[1.5px_1.5px_0px_0px_rgba(11,11,11,1)]">
            <Image src="/logo.png" className="size-full object-cover" alt="RB logo" width={36} height={36} />
          </div>
          <div>
            <span className="block text-sm font-black tracking-tight text-charcoal">Radar de Base</span>
            <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-burnt-yellow">
              Mapa de Mundos
            </span>
          </div>
        </div>
        
        <MobileNavMenu userEmail={user?.email ?? undefined} useMocks={USE_MOCKS} />
      </header>

      <div className="radar-paper border-b border-cement px-4 py-2 xl:hidden">
        <PwaInstallCta />
      </div>

      {/* Adventure progress strip hidden for priority flow focus */}

      <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col xl:flex-row">
        {/* Desktop Sidebar (Hidden on mobile) */}
        <div className="hidden xl:block shrink-0">
          <Sidebar userEmail={user?.email ?? undefined} useMocks={USE_MOCKS} />
        </div>
        
        <main className="flex-1 overflow-x-hidden px-4 py-4 sm:px-5 xl:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
