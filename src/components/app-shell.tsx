import { getInternalSession } from "@/lib/supabase/auth";
import { USE_MOCKS } from "@/lib/config";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ConnectionIndicator } from "@/components/connection-indicator";
import { AdventureStrip } from "@/components/radar/adventure-strip";
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
        
        <div className="flex items-center gap-2">
          <ConnectionIndicator variant="mobile" />
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="size-10 rounded-[2px] border-2 border-charcoal bg-white/5 text-charcoal hover:bg-cement/10 hover:text-charcoal active:translate-x-[1px] active:translate-y-[1px] transition-all">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-[min(22rem,100vw)] max-w-full p-0">
              <Sidebar 
                userEmail={user?.email ?? undefined} 
                useMocks={USE_MOCKS} 
                mobile
                className="h-full xl:border-none xl:sticky-none"
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <AdventureStrip progress={adventureProgress} />

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
