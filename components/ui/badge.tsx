import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:opacity-90",
  {
    variants: {
      tone: {
        sage: "bg-[var(--sage-soft)] text-[var(--sage-ink)]",
        green: "bg-[var(--green-soft)] text-[var(--green-ink)]",
        rose: "bg-[var(--rose-soft)] text-[var(--rose-ink)]",
        plum: "bg-[var(--plum-soft)] text-[var(--plum-ink)]",
        muted: "bg-[var(--muted-soft)] text-[var(--muted-ink)]",
        gold: "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-[var(--gold)]",
      },
      size: {
        sm: "px-2 py-1 text-[11px]",
        md: "px-2.5 py-1.5 text-xs",
      },
      nodot: {
        true: "before:hidden",
        false: "",
      },
    },
    defaultVariants: {
      tone: "muted",
      size: "md",
      nodot: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, size, nodot, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size, nodot }), className)} {...props} />;
}

export { Badge, badgeVariants };
