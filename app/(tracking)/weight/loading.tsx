import { TrackingSkeleton } from "@/components/tracking/states";

export default function Loading() {
  return (
    <TrackingSkeleton
      title="Weight"
      description="Look at the trend. Every check-in is one small part of your progress."
    />
  );
}
