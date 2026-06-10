"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MoreHorizontal, Download, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Popover, MenuItem } from "@/components/ui/Popover";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToggleFavorite, useDeleteWithUndo } from "@/data/queries";
import { cn } from "@/lib/cn";
import type { Transcription } from "@/lib/types";

export function FavoriteButton({ song, className }: { song: Transcription; className?: string }) {
  const toggle = useToggleFavorite();
  return (
    <IconButton
      label={song.isFavorite ? "Remove favorite" : "Favorite"}
      active={song.isFavorite}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(song);
      }}
    >
      <Heart className={cn("h-[18px] w-[18px]", song.isFavorite && "fill-current")} />
    </IconButton>
  );
}

export function MoreMenu({
  song,
  afterDelete,
  className,
}: {
  song: Transcription;
  afterDelete?: () => void;
  className?: string;
}) {
  const del = useDeleteWithUndo();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <Popover
        align="end"
        trigger={
          <IconButton label="More actions" className={className} onClick={(e) => e.preventDefault()}>
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </IconButton>
        }
      >
        {(close) => (
          <>
            <MenuItem
              icon={<Download className="h-4 w-4" />}
              onClick={() => {
                close();
                const a = document.createElement("a");
                a.href = song.url;
                a.download = song.fileName;
                a.click();
              }}
            >
              Download MIDI
            </MenuItem>
            <MenuItem
              danger
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => {
                close();
                setConfirm(true);
              }}
            >
              Delete
            </MenuItem>
          </>
        )}
      </Popover>
      <ConfirmDialog
        open={confirm}
        title="Delete this song?"
        body={`This removes ${song.title} from your library.`}
        onConfirm={() => {
          del(song);
          afterDelete?.();
          if (afterDelete) router.push("/");
        }}
        onClose={() => setConfirm(false)}
      />
    </>
  );
}
