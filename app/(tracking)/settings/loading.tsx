import { TrackingSkeleton } from "@/components/tracking/states";

export default function Loading() {
  return (
    <TrackingSkeleton
      title="Settings"
      description="Set goals that work for you. Leave any target blank to track without a goal."
    />
  );
}
