import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary px-4 py-2.5 text-primary-foreground shadow-sm hover:opacity-90",
        secondary: "bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-4 py-2.5 text-foreground ring-1 ring-[color-mix(in_srgb,var(--color-primary)_25%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
        ghost: "px-3 py-2 text-foreground hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
        destructive: "bg-red-600 px-4 py-2.5 text-white shadow-sm hover:bg-red-500",
        outline: "border border-border bg-transparent px-4 py-2.5 text-foreground hover:bg-muted",
      },
      size: {
        default: "h-10",
        sm: "h-9 px-3",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
