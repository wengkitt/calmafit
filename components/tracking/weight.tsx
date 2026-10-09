"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { ActionForm, InputField, SelectField } from "./forms";
import { EmptyState } from "./states";
import { PageHeading } from "./shell";
import { deleteWeight, saveWeight } from "@/lib/tracking/actions";
import type { readWeight } from "@/lib/tracking/data";
import { displayDate, formatNumber } from "@/lib/tracking/nutrition";

const WeightChart = dynamic(() => import("./weight-chart"), {
  loading: () => <Skeleton className="h-64 w-full" />,
});
export function WeightTracker({
  entries,
  chartEntries,
  settings,
  today,
  latest,
  first,
  range,
  before,
  nextBefore,
}: Awaited<ReturnType<typeof readWeight>>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editor, setEditor] = useState<{ date: string; kilograms?: number } | null>(null),
    [deleting, setDeleting] = useState(false),
    [message, setMessage] = useState("");
  const change = latest && first ? latest.kilograms - first.kilograms : null;
  const historyHref = (cursor?: string | null) => {
    const params = new URLSearchParams({ range: String(range) });
    if (cursor) params.set("before", cursor);
    return `/weight?${params}`;
  };
  return (
    <>
      <PageHeading
        eyebrow="The bigger picture"
        title="Weight"
        description="Look at the trend. Every check-in is one small part of your progress."
        action={
          <Button
            size="lg"
            onClick={() => {
              setDeleting(false);
              setEditor({ date: today });
            }}
          >
            <Plus data-icon="inline-start" />
            Log weight
          </Button>
        }
      />
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Latest weight",
            value: latest ? `${formatNumber(latest.kilograms)} kg` : "—",
            note: latest ? displayDate(latest.date) : "No entries yet",
          },
          {
            label: "Change from first entry",
            value: change === null ? "—" : `${change > 0 ? "+" : ""}${formatNumber(change)} kg`,
            note: first ? `Since ${displayDate(first.date)}` : "Your progress over time",
          },
          {
            label: "Target weight",
            value: settings?.targetWeight ? `${formatNumber(settings.targetWeight)} kg` : "—",
            note: settings?.targetWeight ? "Your personal goal" : "Set a goal in Settings",
          },
        ].map((s) => (
          <Card key={s.label} className="shadow-none">
            <CardHeader>
              <CardTitle className="text-xs font-normal text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{s.value}</p>
              <p className="mt-2 text-xs text-muted-foreground">{s.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Weight over time</CardTitle>
          <FieldGroup className="max-w-48">
            <SelectField
              label="Chart range"
              name="range"
              value={String(range)}
              disabled={pending}
              onChange={(event) => {
                const params = new URLSearchParams({ range: event.target.value });
                if (before) params.set("before", before);
                startTransition(() => router.replace(`/weight?${params}`, { scroll: false }));
              }}
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </SelectField>
          </FieldGroup>
          {pending && (
            <p role="status" className="text-xs text-muted-foreground">
              Updating chart…
            </p>
          )}
        </CardHeader>
        <CardContent>
          <WeightChart entries={chartEntries} />
        </CardContent>
      </Card>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Your check-ins</h2>
        {entries.length ? (
          <div className="overflow-hidden rounded-lg border">
            {entries.map((e) => (
              <button
                key={e.id}
                className="flex min-h-16 w-full items-center justify-between gap-4 border-b px-5 py-3 text-left last:border-b-0 hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-ring"
                onClick={() => {
                  setDeleting(false);
                  setEditor(e);
                }}
                aria-label={`Edit weight for ${displayDate(e.date)}`}
              >
                <span className="text-sm">{displayDate(e.date)}</span>
                <span className="text-sm font-medium tabular-nums">
                  {formatNumber(e.kilograms)} kg{" "}
                  <span className="ml-3 text-muted-foreground">→</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title={before ? "No older check-ins" : "No check-ins yet"}
            description={
              before
                ? "Return to your latest check-ins to view recent measurements."
                : "You can log today’s weight or add a measurement from a previous date."
            }
          />
        )}
        {(before || nextBefore) && (
          <nav aria-label="Check-in history" className="flex flex-wrap gap-3">
            {before && (
              <Link
                href={historyHref()}
                scroll={false}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Latest check-ins
              </Link>
            )}
            {nextBefore && (
              <Link
                href={historyHref(nextBefore)}
                scroll={false}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Older check-ins
              </Link>
            )}
          </nav>
        )}
      </section>
      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deleting ? "Delete check-in" : "Log weight"}</DialogTitle>
            <DialogDescription>
              {deleting
                ? "Remove this measurement from your history?"
                : "One measurement per date. Saving an existing date replaces its weight."}
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <>
              <ActionForm
                action={deleting ? deleteWeight : saveWeight}
                submitLabel={deleting ? "Delete check-in" : "Save weight"}
                onSuccess={() => {
                  setEditor(null);
                  setMessage("Weight history updated.");
                }}
              >
                <FieldGroup>
                  {deleting ? (
                    <input type="hidden" name="date" value={editor.date} />
                  ) : (
                    <>
                      <InputField
                        label="Date"
                        name="date"
                        type="date"
                        defaultValue={editor.date}
                        required
                      />
                      <InputField
                        label="Weight (kg)"
                        name="kilograms"
                        type="number"
                        inputMode="decimal"
                        defaultValue={editor.kilograms ?? ""}
                        min="0.001"
                        max="1000"
                        step="any"
                        required
                        placeholder="e.g. 72.5"
                      />
                    </>
                  )}
                </FieldGroup>
              </ActionForm>
              {editor.kilograms && (
                <Button
                  variant={deleting ? "ghost" : "destructive"}
                  onClick={() => setDeleting(!deleting)}
                >
                  {deleting ? "Keep check-in" : "Delete check-in"}
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
