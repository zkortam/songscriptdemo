"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { BrandMark } from "./BrandMark";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { AddSongButton } from "./AddSongButton";

export function AppHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-30 px-4 pt-3 before:pointer-events-none before:fixed before:inset-x-0 before:top-0 before:h-3 before:bg-canvas before:content-[''] sm:px-6 lg:px-8">
      <div
        className={cn(
          "mx-auto flex max-w-content items-center justify-between rounded-full px-3 py-2 transition",
          scrolled ? "glass-chrome shadow-soft" : "border border-transparent",
        )}
      >
        <BrandMark />
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline-flex">
            <AddSongButton />
          </span>
          <span className="sm:hidden">
            <AddSongButton compact />
          </span>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
