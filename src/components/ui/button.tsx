import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[4px] border-2 border-transparent bg-clip-padding text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-burnt-yellow text-charcoal border-charcoal shadow-[3px_3px_0px_0px_rgba(11,11,11,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(11,11,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(11,11,11,1)] dark:border-off-white dark:shadow-[3px_3px_0px_0px_rgba(231,224,210,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(231,224,210,1)]",
        outline:
          "border-cement bg-transparent text-charcoal hover:bg-cement hover:text-off-white dark:border-cement dark:text-off-white dark:hover:bg-cement",
        secondary:
          "bg-concrete-dark text-off-white border-burnt-yellow shadow-[2px_2px_0px_0px_rgba(242,169,0,0.8)] hover:bg-charcoal hover:border-burnt-yellow/90 dark:border-burnt-yellow dark:bg-charcoal dark:hover:bg-concrete-dark",
        ghost:
          "hover:bg-cement/20 hover:text-charcoal dark:hover:bg-cement/30 dark:hover:text-off-white",
        destructive:
          "bg-rust text-off-white border-charcoal hover:bg-rust/90 shadow-[2px_2px_0px_0px_rgba(11,11,11,1)]",
        link: "text-burnt-yellow underline underline-offset-4 hover:text-dark-yellow",
      },
      size: {
        default:
          "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-7 gap-1 px-2.5 text-[10px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8.5 gap-1.5 px-3 text-[11px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8.5",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
