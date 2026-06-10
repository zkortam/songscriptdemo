"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, Heart, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { AddSongButton } from "./AddSongButton";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/styles";

const STORAGE_KEY = "songscription-sidebar-collapsed";

function NavLink({
  href,
  active,
  icon,
  label,
  collapsed,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex h-10 w-full items-center rounded-lg text-[14px] transition-[background-color,color] duration-200",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-green-500/15 font-medium text-green-700 dark:text-green-300"
          : "text-muted hover:bg-surface/60 hover:text-ink",
        focusRing,
      )}
    >
      <span className={cn("shrink-0", active ? "" : "text-faint")}>{icon}</span>
      {/* Label keeps mounted and animates its width/opacity, so it wipes smoothly
          with the panel instead of popping in and out. */}
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-silk",
          collapsed ? "max-w-0 opacity-0" : "ml-2.5 max-w-[160px] opacity-100",
        )}
      >
        {label}
      </span>
    </Link>
  );
  return collapsed ? (
    <Tooltip label={label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  // Expose the rail width to CSS so a full-bleed sticky bar can span the content area.
  useEffect(() => {
    document.documentElement.classList.toggle("sidebar-collapsed", collapsed);
  }, [collapsed]);
  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      return !c;
    });
  };

  const onLibrary = pathname === "/";
  const fav = sp.get("fav") === "1";
  const other = Boolean(sp.get("tags") || sp.get("q"));
  const allActive = onLibrary && !fav && !other;
  const favActive = onLibrary && fav;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col gap-1 overflow-hidden bg-ink/[0.03] py-5 transition-[width,padding] duration-300 ease-silk dark:bg-white/[0.03] lg:flex",
        collapsed ? "w-[68px] px-3" : "w-60 px-4",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "px-1")}>
        <BrandMark compact={collapsed} />
      </div>

      <div className={cn("mt-5", collapsed && "flex w-full justify-center")}>
        {collapsed ? <AddSongButton compact /> : <AddSongButton fullWidth />}
      </div>

      <nav className="mt-6 flex flex-col gap-0.5">
        <p
          className={cn(
            "overflow-hidden whitespace-nowrap px-3 text-[12px] font-medium uppercase tracking-wide text-faint transition-[max-height,opacity] duration-300 ease-silk",
            collapsed ? "max-h-0 opacity-0" : "max-h-6 pb-1 opacity-100",
          )}
        >
          Library
        </p>
        <NavLink
          href="/"
          active={allActive}
          collapsed={collapsed}
          label="All songs"
          icon={<LayoutGrid className="h-[18px] w-[18px]" />}
        />
        <NavLink
          href="/?fav=1"
          active={favActive}
          collapsed={collapsed}
          label="Favorites"
          icon={<Heart className="h-[18px] w-[18px]" />}
        />
      </nav>

      <div className="flex-1" />

      <div
        className={cn(
          "flex",
          collapsed ? "flex-col items-center gap-2" : "items-center justify-between px-1",
        )}
      >
        <UserMenu placement="top" />
        <div className={cn("flex", collapsed ? "flex-col gap-2" : "items-center gap-1")}>
          <ThemeToggle />
          <IconButton label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggle}>
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            )}
          </IconButton>
        </div>
      </div>
    </aside>
  );
}
