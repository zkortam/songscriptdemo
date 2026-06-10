"use client";
import { Popover } from "@/components/ui/Popover";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useTranscriptions } from "@/data/queries";
import { useTheme } from "@/providers/ThemeProvider";
import { formatCount } from "@/lib/format";

export function UserMenu({ placement = "bottom" }: { placement?: "bottom" | "top" }) {
  const { data } = useTranscriptions();
  const { theme, setTheme } = useTheme();
  const songs = data?.length ?? 0;
  const practiced = data?.reduce((s, t) => s + t.practiceCount, 0) ?? 0;
  const favorites = data?.filter((t) => t.isFavorite).length ?? 0;

  const avatar = (
    <button
      aria-label="Your account and settings"
      className="grid h-10 w-10 place-items-center rounded-full bg-green-500/20 text-[14px] font-semibold text-green-700 transition hover:bg-green-500/30 dark:text-green-300"
    >
      Y
    </button>
  );

  return (
    <Popover trigger={avatar} align={placement === "top" ? "start" : "end"} side={placement} className="w-64">
      <div className="px-2 pb-2 pt-1.5">
        <p className="text-[14px] font-semibold">Your library</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {formatCount(songs)} songs, {formatCount(practiced)} sessions, {formatCount(favorites)}{" "}
          favorites
        </p>
      </div>
      <div className="px-2 py-2">
        <p className="mb-1.5 text-[13px] text-muted">Theme</p>
        <SegmentedToggle
          size="sm"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "Auto" },
          ]}
        />
      </div>
    </Popover>
  );
}
