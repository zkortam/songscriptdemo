import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-[18px] font-semibold">We could not find that page.</p>
      <Link
        href="/"
        className="mt-4 inline-flex h-9 items-center rounded-full glass-card px-4 text-[13px] hover:bg-surface/75"
      >
        Back to library
      </Link>
    </div>
  );
}
