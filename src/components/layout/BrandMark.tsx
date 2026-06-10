import Link from "next/link";
import { AudioWaveform } from "lucide-react";
import { focusRing } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

export function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Songscription, back to your library"
      className={cn(
        "inline-flex items-center rounded-full",
        compact ? "h-10 w-10 justify-center" : "gap-2 px-2 py-1",
        focusRing,
      )}
    >
      <AudioWaveform className="h-5 w-5 shrink-0 text-green-600 dark:text-green-300" />
      {!compact && <span className="text-[17px] font-semibold tracking-tight">songscription</span>}
    </Link>
  );
}
