import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading } from "./shell";
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Empty className="px-4 py-8">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
export function TrackingSkeleton({ title, description }: { title?: string; description?: string }) {
  return (
    <div role="status" aria-label="Loading your data" className="flex flex-col gap-6">
      {title && <PageHeading eyebrow="" title={title} description={description ?? ""} />}
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
