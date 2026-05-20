import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[2px] border-2 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-burnt-yellow text-charcoal border-charcoal shadow-[1.5px_1.5px_0px_0px_rgba(11,11,11,1)] dark:border-off-white dark:shadow-[1.5px_1.5px_0px_0px_rgba(231,224,210,1)]",
        secondary:
          "bg-off-white text-charcoal border-charcoal dark:bg-concrete-dark dark:text-off-white dark:border-cement",
        destructive:
          "bg-rust text-off-white border-charcoal dark:border-off-white",
        outline:
          "border-cement text-cement bg-transparent dark:text-off-white/80 dark:border-cement",
        ghost:
          "hover:bg-cement/20 hover:text-charcoal border-transparent dark:hover:bg-cement/35 dark:hover:text-off-white",
        link: "text-burnt-yellow underline underline-offset-4 hover:text-dark-yellow border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
