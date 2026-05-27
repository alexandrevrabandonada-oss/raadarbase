"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ConnectionIndicator } from "@/components/connection-indicator";
import { Sidebar } from "@/components/sidebar";

export function MobileNavMenu({
  userEmail,
  useMocks,
}: {
  userEmail: string | undefined;
  useMocks: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <ConnectionIndicator variant="mobile" />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="outline" size="icon" className="size-10 rounded-[2px] border-2 border-charcoal bg-white/5 text-charcoal hover:bg-cement/10 hover:text-charcoal active:translate-x-[1px] active:translate-y-[1px] transition-all">
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-[min(22rem,100vw)] max-w-full p-0">
          {open ? (
            <Sidebar
              userEmail={userEmail}
              useMocks={useMocks}
              mobile
              className="h-full xl:border-none xl:sticky-none"
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
