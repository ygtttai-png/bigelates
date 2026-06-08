import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-white shadow-[0_4px_12px_-5px_color-mix(in_oklab,var(--accent)_70%,transparent)] hover:brightness-105 dark:text-[#16140f]",
        secondary:
          "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-2)]",
        ghost: "bg-transparent text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
        danger: "bg-[var(--rose-soft)] text-[var(--rose-ink)] hover:brightness-[0.98]",
        outline: "border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-2)]",
      },
      size: {
        sm: "h-8 px-3 text-[13px] rounded-[10px]",
        md: "h-10 px-4 text-sm",
        lg: "h-[46px] px-5 text-[15px] rounded-[13px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  full?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, full, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), full && "w-full")}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
