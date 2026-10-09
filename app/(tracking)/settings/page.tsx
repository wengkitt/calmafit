import { Suspense } from "react";
import { TrackingSettings } from "@/components/tracking/settings";
import Loading from "./loading";
import { readSettings } from "@/lib/tracking/data";
export const metadata = { title: "Settings" };
async function SettingsContent() {
  return <TrackingSettings settings={await readSettings()} />;
}
export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingsContent />
    </Suspense>
  );
}
