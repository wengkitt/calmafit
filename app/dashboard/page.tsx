import { Suspense } from "react";
import { AppShell } from "@/components/tracking/shell";
import { Diary } from "@/components/tracking/diary";
import { TrackingSkeleton } from "@/components/tracking/states";
import { InitializeTimezone } from "@/components/tracking/timezone";
import { readDiary } from "@/lib/tracking/data";
export const metadata = { title: "Food diary" };
async function DiaryContent({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const data = await readDiary(date);
  return (
    <>
      <InitializeTimezone needed={!data.settings} />
      <Diary {...data} />
    </>
  );
}
export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <AppShell>
      <Suspense fallback={<TrackingSkeleton />}>
        <DiaryContent searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}
