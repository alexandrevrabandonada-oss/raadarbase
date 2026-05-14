import { getInternalSession } from "@/lib/supabase/auth";
import { USE_MOCKS } from "@/lib/config";
import { Sidebar } from "@/components/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getInternalSession();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Mobile Header */}
      <header className="radar-paper sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-300/70 px-4 xl:hidden">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-black text-white font-black text-sm shadow-md">
            RB
          </div>
          <div>
            <span className="block text-sm font-black tracking-tight">Radar de Base</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Mapa de Mundos
            </span>
          </div>
        </div>
        
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
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
      </header>

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
