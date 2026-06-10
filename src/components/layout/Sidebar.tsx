"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, Heart, PanelLeft } from "lucide-react";
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
        "flex items-center rounded-lg text-[14px] transition",
        collapsed ? "h-10 w-10 justify-center" : "gap-2.5 px-3 py-2",
        active
          ? "bg-green-500/15 font-medium text-green-700 dark:text-green-300"
          : "text-muted hover:bg-surface/60 hover:text-ink",
        focusRing,
      )}
    >
      <span className={active ? "" : "text-faint"}>{icon}</span>
      {!collapsed && label}
    </Link>
  );
  return collapsed ? <Tooltip label={label}>{link}</Tooltip> : link;
}

export function Sidebar() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);
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
        "sticky top-0 hidden h-svh shrink-0 flex-col gap-1 bg-ink/[0.03] py-5 transition-[width] duration-200 dark:bg-white/[0.03] lg:flex",
        collapsed ? "w-[72px] items-center px-2" : "w-60 px-4",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "justify-between px-1")}>
        <BrandMark compact={collapsed} />
        <IconButton label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggle}>
          <PanelLeft className="h-[18px] w-[18px]" />
        </IconButton>
      </div>

      <div className={cn("mt-5", collapsed && "flex w-full justify-center")}>
        {collapsed ? <AddSongButton compact /> : <AddSongButton fullWidth />}
      </div>

      <nav className={cn("mt-6", collapsed ? "flex w-full flex-col items-center gap-1" : "space-y-0.5")}>
        {!collapsed && (
          <p className="px-3 pb-1 text-[12px] font-medium uppercase tracking-wide text-faint">Library</p>
        )}
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
          "flex items-center",
          collapsed ? "flex-col gap-2" : "justify-between px-1",
        )}
      >
        <UserMenu placement="top" />
        <ThemeToggle />
      </div>
    </aside>
  );
}
