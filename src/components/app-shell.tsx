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
      <header className="lg:hidden h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-black text-white font-black text-sm shadow-md">
            RB
          </div>
          <span className="font-black text-sm tracking-tight">Radar de Base</span>
        </div>
        
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            }
          />
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar 
              userEmail={user?.email ?? undefined} 
              useMocks={USE_MOCKS} 
              className="lg:border-none lg:sticky-none h-full"
            />
          </SheetContent>
        </Sheet>
      </header>

      <div className="mx-auto flex flex-1 w-full max-w-7xl flex-col lg:flex-row">
        {/* Desktop Sidebar (Hidden on mobile) */}
        <div className="hidden lg:block shrink-0">
          <Sidebar userEmail={user?.email ?? undefined} useMocks={USE_MOCKS} />
        </div>
        
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
