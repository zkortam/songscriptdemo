"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-[18px] font-semibold">Something went wrong.</p>
      <p className="mt-1 text-[14px] text-muted">Please try again.</p>
      <div className="mt-4 flex justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={reset}>
          Try again
        </Button>
        <Link href="/" className="inline-flex h-9 items-center rounded-full glass-card px-4 text-[13px] hover:bg-surface/75">
          Back to library
        </Link>
      </div>
    </div>
  );
}
