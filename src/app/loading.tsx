import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 pt-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-11 w-full max-w-xl rounded-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[230px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
