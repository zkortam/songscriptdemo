/**
 * Seed the catalogue with N demo songs. Each song is a UNIQUE, procedurally
 * generated MIDI (its own melody + bass in a random key/tempo), so the audio,
 * piano roll, note range, fingerprint, and metadata are all real and consistent.
 * Run: npm run seed [count]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

try {
  const txt = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local */
}

import { createClient } from "@supabase/supabase-js";
import { Midi } from "@tonejs/midi";
import { parseMidi } from "../src/lib/midi";
import { difficultyLabel } from "../src/lib/format";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const COUNT = Number(process.argv[2] ?? 300);

const SONG_TITLES = [
  "Clair de Lune", "River Flows in You", "Moonlight Sonata", "Comptine d'un autre été",
  "Gymnopédie No. 1", "Nuvole Bianche", "Canon in D", "Prelude in C", "The Entertainer",
  "Hallelujah", "Someone Like You", "All of Me", "A Thousand Years", "Married Life",
  "Mad World", "Kiss the Rain", "Merry Go Round of Life", "Your Lie in April", "He's a Pirate",
  "La Vie en Rose", "Fly Me to the Moon", "Autumn Leaves", "Bella's Lullaby", "Liebestraum",
  "Ballade No. 1", "Arabesque No. 1", "Spring Waltz", "Turkish March", "Ode to Joy",
  "Greensleeves", "Photograph", "Perfect", "Lovely", "Snowman", "Dawn", "Experience",
  "Carol of the Bells", "Golden Hour", "Saturn", "Nocturne", "First Light", "Aurora",
  "Weightless", "Reverie", "Still",
];
const GENRES = ["classical", "pop", "film score", "jazz", "lofi", "anime", "ambient"];
const SCALES: Record<string, number[]> = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: T[]) => a[rand(a.length)];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Procedurally generate a small, musical piano piece. */
function generateMidi(): Buffer {
  const tempo = 68 + rand(76); // 68..143
  const root = rand(12);
  const scale = SCALES[Math.random() < 0.42 ? "minor" : "major"];
  const m = new Midi();
  m.header.tempos = [{ ticks: 0, bpm: tempo } as never];
  m.header.update(); // compute tempo time map so addNote(time) terminates
  const beat = 60 / tempo;
  const bars = 6 + rand(14);

  const rh = m.addTrack();
  rh.instrument.number = 0;
  let t = 0;
  let deg = 7;
  for (let i = 0; i < bars * 4; i++) {
    if (Math.random() < 0.85) {
      deg += rand(5) - 2;
      deg = Math.max(0, Math.min(14, deg));
      const note = Math.max(55, Math.min(84, (4 + Math.floor(deg / 7) + 1) * 12 + ((root + scale[deg % 7]) % 12)));
      rh.addNote({ midi: note, time: t, duration: beat * 0.45, velocity: 0.55 + Math.random() * 0.3 });
    }
    t += beat * (Math.random() < 0.5 ? 0.5 : 1);
  }

  const lh = m.addTrack();
  lh.instrument.number = 0;
  for (let b = 0; b < bars; b++) {
    const pc = (root + scale[[0, 3, 4, 5][rand(4)] % 7]) % 12;
    lh.addNote({ midi: 36 + pc, time: b * beat * 4, duration: beat * 2.2, velocity: 0.45 });
  }

  return Buffer.from(m.toArray());
}

async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]);
        if (idx % 10 === 0) process.stdout.write(".");
      }
    }),
  );
}

async function main() {
  console.log(`Seeding ${COUNT} songs...`);
  const titles = [...SONG_TITLES].sort(() => Math.random() - 0.5);
  const items = Array.from({ length: COUNT }, (_, i) => ({
    title: i < titles.length ? titles[i] : `${pick(SONG_TITLES)} (${i})`,
  }));

  await pool(items, 8, async (item) => {
    const id = crypto.randomUUID();
    const buf = generateMidi();
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    const parsed = parseMidi(ab, `${slug(item.title)}.mid`);

    const { error: upErr } = await supabase.storage
      .from("midi")
      .upload(`${id}.mid`, buf, { contentType: "audio/midi", upsert: true });
    if (upErr) {
      console.error("\nupload:", upErr.message);
      return;
    }

    const practiced = Math.random() < 0.55;
    const row = {
      id,
      created_at: new Date(Date.now() - rand(120) * 86400000).toISOString(),
      title: item.title,
      file_name: `${slug(item.title)}.mid`,
      file_path: `${id}.mid`,
      file_size: buf.byteLength,
      duration_seconds: parsed.durationSeconds,
      tempo_bpm: parsed.tempoBpm,
      key_signature: parsed.keySignature,
      key_is_estimated: parsed.keyIsEstimated,
      time_signature: parsed.timeSignature,
      track_count: parsed.trackCount,
      note_count: parsed.noteCount,
      lowest_note: parsed.lowestNote,
      highest_note: parsed.highestNote,
      instruments: parsed.instruments,
      is_percussion_only: parsed.isPercussionOnly,
      difficulty_score: parsed.difficultyScore,
      difficulty_parts: parsed.difficultyParts,
      accent_hue: parsed.accentHue,
      is_favorite: Math.random() < 0.22,
      tags: [difficultyLabel(parsed.difficultyScore).toLowerCase(), pick(GENRES)],
      last_practiced_at: practiced ? new Date(Date.now() - rand(30) * 86400000).toISOString() : null,
      practice_count: practiced ? 1 + rand(20) : 0,
      accuracy_pct: practiced ? 80 + rand(18) : null,
      thumb: parsed.thumb,
    };
    const { error } = await supabase.from("transcriptions").insert(row);
    if (error) console.error("\ninsert:", error.message);
  });

  console.log("\nDone.");
}

main();
