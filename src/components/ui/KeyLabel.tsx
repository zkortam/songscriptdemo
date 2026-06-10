import { cn } from "@/lib/cn";

/**
 * Renders a key signature with a quiet, de-emphasized "est." when the key was
 * estimated rather than read from the file — so it reads as a footnote, not a
 * loud "(est.)" repeated on every card and row.
 */
export function KeyLabel({
  keySignature,
  estimated,
  className,
}: {
  keySignature: string;
  estimated: boolean;
  className?: string;
}) {
  return (
    <span className={className}>
      {keySignature}
      {estimated && (
        <span className="text-[0.82em] text-faint" title="Key estimated from the notes">
          {" "}
          est.
        </span>
      )}
    </span>
  );
}
