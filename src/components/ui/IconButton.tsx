"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";
import { Tooltip } from "./Tooltip";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, active, className, ...props },
  ref,
) {
  const btn = (
    <button
      ref={ref}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full transition",
        "text-ink/80 hover:bg-surface/70 hover:text-ink active:scale-95",
        "disabled:pointer-events-none disabled:opacity-40",
        active && "text-green-600 dark:text-green-300",
        focusRing,
        className,
      )}
      {...props}
    />
  );
  return <Tooltip label={label}>{btn}</Tooltip>;
});
