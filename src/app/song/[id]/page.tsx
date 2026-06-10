import { notFound } from "next/navigation";
import { getTranscriptionById } from "@/data/server";
import { SongDetail } from "@/components/song/SongDetail";

export const dynamic = "force-dynamic";

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = await getTranscriptionById(id);
  if (!song) notFound();
  return <SongDetail song={song} />;
}
