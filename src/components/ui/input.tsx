import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"
import { playSynthKeypress } from "@/lib/audio"

function Input({ className, type, onKeyDown, ...props }: React.ComponentProps<"input">) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Play subtle mechanical sound on normal key typing
    if (e.key && e.key.length === 1) {
      playSynthKeypress();
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      onKeyDown={handleKeyDown}
      className={cn(
        "h-8 w-full min-w-0 rounded-[2px] border-2 border-charcoal bg-off-white/80 px-2.5 py-1 text-base text-charcoal transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-zinc-500 focus-visible:border-burnt-yellow disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-cement/20 disabled:opacity-50 aria-invalid:border-rust aria-invalid:ring-3 md:text-sm dark:bg-concrete-dark/30 dark:text-off-white dark:border-cement dark:placeholder:text-cement/80",
        className
      )}
      {...props}
    />
  )
}

export { Input }
