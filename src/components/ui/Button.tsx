"use client";
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

const button = cva(
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition",
    "active:scale-[.98] disabled:pointer-events-none disabled:opacity-40",
    focusRing,
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-green-500 text-white hover:bg-green-600 active:bg-green-700 dark:bg-green-400 dark:text-green-950 dark:hover:bg-green-300",
        secondary: "bg-butter text-green-950 hover:bg-butter-deep",
        ghost: "glass-card text-ink hover:bg-surface/75",
        quiet: "text-muted hover:bg-surface/60 hover:text-ink",
        danger: "bg-danger text-white hover:brightness-95",
      },
      size: { sm: "h-9 px-4 text-[13px]", md: "h-11 px-5 text-[15px]" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, isLoading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(button({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
