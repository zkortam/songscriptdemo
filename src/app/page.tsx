import { Suspense } from "react";
import { getInitialTranscriptions } from "@/data/server";
import { CatalogueView } from "@/components/catalogue/CatalogueView";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await getInitialTranscriptions();
  return (
    <div className="pt-6">
      <Suspense>
        <CatalogueView initial={initial} />
      </Suspense>
    </div>
  );
}
