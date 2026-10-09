import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { Diary } from "@/components/tracking/diary";
import Loading from "./loading";
import { InitializeTimezone } from "@/components/tracking/timezone";
import { readDiary } from "@/lib/tracking/data";
export const metadata = { title: "Food diary" };
async function DiaryContent({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  "use cache: private";
  cacheLife({ stale: 300 });
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
    <Suspense fallback={<Loading />}>
      <DiaryContent searchParams={searchParams} />
    </Suspense>
  );
}
