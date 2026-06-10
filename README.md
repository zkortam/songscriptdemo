# Songscription — Catalogue

A single-page library where you upload MIDI files (a stand-in for "you just transcribed a song"),
browse them, and open one to see learner-relevant detail and **play it back in the browser** on an
interactive piano roll.

Built with Next.js 15 (App Router), TypeScript, Tailwind, and Supabase.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000 — works immediately, no setup
```

Out of the box it persists to a local file store (`.data/`), so you can upload, browse, and play
right away. To use **Supabase** (production), add keys and the app switches automatically:

```bash
# Create a free Supabase project, run supabase/schema.sql in its SQL editor
# (table, indexes, public `midi` storage bucket), then:
cp .env.example .env.local      # set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only)
```

Other scripts: `npm test`, `npm run typecheck`, `npm run build`,
`npm run seed [count]` (seed N demo songs into Supabase to feel the catalogue at scale).

The backend is chosen by a small `Store` interface (`src/lib/store`): Supabase when configured,
otherwise the local file store. Route handlers depend only on the interface, so the two are
interchangeable and both are exercised by tests.

## What it does

- **Upload** one or many `.mid` files by drag-and-drop anywhere or the Add song button. Files parse,
  store, and appear with a live progress tray that survives navigating away mid-upload.
- **Browse** with instant search (title and tags), sort, favorites and tag filters, and a grid or a
  dense list view. "Surprise me" and a "Jump back in" shelf help when you do not know what to play.
- **Open a song** for its key, tempo, time signature, duration, a difficulty ring, the played note
  range on a mini keyboard, practice stats, and a **Synthesia-style falling-notes roll** that plays
  the MIDI with a real piano voice, hand-split colors, seeking, practice speeds, and loop.

## Backend

**Supabase** (Postgres + Storage). It is what Songscription uses, so it doubles as a "can work in your
stack" signal, and Storage plus a typed Postgres table is the right shape for "a file plus metadata."

All database access is **server-side only** through Next route handlers using the service-role key;
the browser never holds a Supabase key. Row Level Security is enabled with no policies (deny all), and
the service role bypasses it. The `midi` bucket is public-read, so playback fetches the file by URL.

## How data is stored and queried

One `transcriptions` table (see `supabase/schema.sql`). Beyond the basics it stores the metadata a
learner cares about, parsed from the MIDI itself: `tempo_bpm`, estimated `key_signature`,
`time_signature`, pitch range, a decomposed `difficulty_parts` plus a `difficulty_score`, a
music-derived `accent_hue`, and a compact `thumb` (at most 64 normalized columns) that the card
fingerprint renders directly so the list payload stays small. Indexes back the sort options
(`created_at`, `is_favorite`, `difficulty_score`, `last_practiced_at`) and a `title` search.

The list endpoint supports server-side `?q=` and `?sort=`, while the client also filters instantly on
the cached set for a snappy feel. Mutations are optimistic with rollback, and the catalogue and detail
pages read the **same React Query cache**, so an edit on one is already reflected on the other.

## A few things worth a look

- **Generative fingerprints** — each card's art is drawn from that song's own notes (a pitch-over-time
  envelope and top-voice contour), so every card is unique and the library reads as a gallery.
- **Music-derived color** — a song's accent hue comes from its key and mode, constrained to a brand
  green-to-cyan band, so color means something and the library stays cohesive.
- **The roll** uses one geometry module shared by the thumbnail and the full player, animates via a
  single GPU transform (no per-frame React), and disposes its audio on navigation.

## Architecture

```
src/lib          pure logic: midi parse, difficulty model, key estimation, accent,
                 roll geometry, formatting, constants, types  (unit-tested)
src/data         api client, React Query hooks + optimistic mutations, SSR reads
src/providers    Query, Theme (FOUC-free), Upload queue
src/components    ui primitives (cva variants) + layout, catalogue, song features
src/app          routes + route handlers + error/not-found/loading
```

Design tokens (color, radius, glass, shadow, type, spacing, motion) live once in the Tailwind config
and `globals.css`; components reference tokens, not raw values.

## Testing

`npm test` runs Vitest against the three bundled sample files, asserting the parser, difficulty model,
key estimation, accent, and formatters (including determinism). Typecheck and lint are clean.

## Submission note

- **Backend and why:** Supabase (Postgres + Storage), because it matches Songscription's stack and is
  the natural fit for storing a file plus rich, queryable metadata, with server-only access for safety.
- **One thing I would do differently with more time:** add the controlled hover-to-preview audio on
  cards (the visual hover is in; the audio engine is scaffolded but gated out to avoid any latency
  feeling), and paginate the list endpoint for libraries in the thousands.
- **One thing I am proud of:** the generative fingerprint and the shared roll geometry, so the same
  musical idea appears as the card art and as the full playable piano roll, from one code path.
