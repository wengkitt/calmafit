import { Suspense } from "react";
import { AppShell, PageHeading } from "@/components/tracking/shell";
import { FoodBank } from "@/components/tracking/food-editor";
import { TrackingSkeleton } from "@/components/tracking/states";
import { readFoods } from "@/lib/tracking/data";
export const metadata = { title: "Food bank" };
async function FoodBankContent() {
  return <FoodBank initialFoods={await readFoods()} />;
}
export default function FoodsPage() {
  return (
    <AppShell>
      <PageHeading
        eyebrow="Built together"
        title="Food bank"
        description="One shared library. Find a food, compare nutrition versions, or contribute your own."
      />
      <Suspense fallback={<TrackingSkeleton />}>
        <FoodBankContent />
      </Suspense>
    </AppShell>
  );
}
