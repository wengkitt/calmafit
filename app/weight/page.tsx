import { Suspense } from "react";
import { AppShell } from "@/components/tracking/shell";
import { WeightTracker } from "@/components/tracking/weight";
import { TrackingSkeleton } from "@/components/tracking/states";
import { InitializeTimezone } from "@/components/tracking/timezone";
import { readWeight } from "@/lib/tracking/data";
export const metadata = { title: "Weight" };
async function WeightContent() {
  const data = await readWeight();
  return (
    <>
      <InitializeTimezone needed={!data.settings} />
      <WeightTracker {...data} />
    </>
  );
}
export default function WeightPage() {
  return (
    <AppShell>
      <Suspense fallback={<TrackingSkeleton />}>
        <WeightContent />
      </Suspense>
    </AppShell>
  );
}
