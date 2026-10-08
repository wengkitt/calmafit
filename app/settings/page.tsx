import { Suspense } from "react";
import { AppShell } from "@/components/tracking/shell";
import { TrackingSettings } from "@/components/tracking/settings";
import { TrackingSkeleton } from "@/components/tracking/states";
import { readSettings } from "@/lib/tracking/data";
export const metadata = { title: "Settings" };
async function SettingsContent() {
  return <TrackingSettings settings={await readSettings()} />;
}
export default function SettingsPage() {
  return (
    <AppShell>
      <Suspense fallback={<TrackingSkeleton />}>
        <SettingsContent />
      </Suspense>
    </AppShell>
  );
}
