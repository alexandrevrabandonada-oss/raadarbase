"use client";

import * as React from "react"

import { cn } from "@/lib/utils"

let keypressAudioPromise: Promise<typeof import("@/lib/audio")> | null = null;

function playKeypressSound() {
  keypressAudioPromise ??= import("@/lib/audio");
  void keypressAudioPromise.then(({ playSynthKeypress }) => playSynthKeypress());
}

function Textarea({ className, onKeyDown, ...props }: React.ComponentProps<"textarea">) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Play subtle mechanical sound on normal key typing
    if (e.key && e.key.length === 1) {
      playKeypressSound();
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <textarea
      data-slot="textarea"
      onKeyDown={handleKeyDown}
      className={cn(
        "flex min-h-16 w-full rounded-[2px] border-2 border-charcoal bg-off-white/80 px-2.5 py-2 text-base text-charcoal transition-colors outline-none placeholder:text-zinc-500 focus-visible:border-burnt-yellow disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-cement/20 disabled:opacity-50 aria-invalid:border-rust md:text-sm dark:bg-concrete-dark/30 dark:text-off-white dark:border-cement dark:placeholder:text-cement/80",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
