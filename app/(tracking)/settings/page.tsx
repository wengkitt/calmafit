import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { TrackingSettings } from "@/components/tracking/settings";
import Loading from "./loading";
import { readSettings } from "@/lib/tracking/data";
export const metadata = { title: "Settings" };
async function SettingsContent() {
  "use cache: private";
  cacheLife({ stale: 300 });
  return <TrackingSettings settings={await readSettings()} />;
}
export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingsContent />
    </Suspense>
  );
}
