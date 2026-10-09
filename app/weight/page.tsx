import { Suspense } from "react";
import { AppShell } from "@/components/tracking/shell";
import { WeightTracker } from "@/components/tracking/weight";
import { TrackingSkeleton } from "@/components/tracking/states";
import { InitializeTimezone } from "@/components/tracking/timezone";
import { readWeight } from "@/lib/tracking/data";
export const metadata = { title: "Weight" };
async function WeightContent({
  searchParams,
}: {
  searchParams: PageProps<"/weight">["searchParams"];
}) {
  const params = await searchParams;
  const data = await readWeight({
    range: typeof params.range === "string" ? params.range : undefined,
    before: typeof params.before === "string" ? params.before : undefined,
  });
  return (
    <>
      <InitializeTimezone needed={!data.settings} />
      <WeightTracker {...data} />
    </>
  );
}
export default function WeightPage({ searchParams }: PageProps<"/weight">) {
  return (
    <AppShell>
      <Suspense fallback={<TrackingSkeleton />}>
        <WeightContent searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}
