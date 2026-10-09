import { TrackingSkeleton } from "@/components/tracking/states";

export default function Loading() {
  return (
    <TrackingSkeleton
      title="Food bank"
      description="One shared library. Find a food, compare nutrition versions, or contribute your own."
    />
  );
}
