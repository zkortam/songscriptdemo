"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-full glass-card px-4 text-[15px] text-ink placeholder:text-faint",
          "focus-visible:bg-surface/80",
          focusRing,
          className,
        )}
        {...props}
      />
    );
  },
);
