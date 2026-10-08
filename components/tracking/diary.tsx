"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Coffee, Moon, Sun, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { FieldGroup } from "@/components/ui/field";
import { ActionForm, InputField } from "./forms";
import { AddFoodButton, MealField, PortionFields } from "./food-editor";
import { EmptyState } from "./states";
import { PageHeading } from "./shell";
import { deleteDiary, saveDiary } from "@/lib/tracking/actions";
import type { DiaryEntry, Settings } from "@/lib/tracking/data";
import {
  displayDate,
  emptyNutrients,
  formatNumber,
  meals,
  nutrientKeys,
  nutrientLabels,
  portionNutrition,
  shiftDate,
  type PortionUnit,
} from "@/lib/tracking/nutrition";
const mealIcons = { breakfast: Coffee, lunch: Sun, dinner: Utensils, snacks: Moon };
function EntryEditor({ entry, onSuccess }: { entry: DiaryEntry; onSuccess: () => void }) {
  const [quantity, setQuantity] = useState(String(entry.quantity)),
    [unit, setUnit] = useState<PortionUnit>(entry.unit),
    [deleting, setDeleting] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      {deleting ? (
        <>
          <p className="text-sm text-muted-foreground">
            Remove {entry.snapshot.name} from your diary?
          </p>
          <ActionForm action={deleteDiary} submitLabel="Delete entry" onSuccess={onSuccess}>
            <input type="hidden" name="entryId" value={entry.id} />
          </ActionForm>
          <Button variant="ghost" onClick={() => setDeleting(false)}>
            Keep entry
          </Button>
        </>
      ) : (
        <>
          <ActionForm action={saveDiary} onSuccess={onSuccess} submitLabel="Save entry">
            <input type="hidden" name="entryId" value={entry.id} />
            <FieldGroup>
              <InputField label="Date" name="date" type="date" defaultValue={entry.date} required />
              <MealField defaultValue={entry.meal} />
              <PortionFields
                nutrition={entry.snapshot}
                quantity={quantity}
                setQuantity={setQuantity}
                unit={unit}
                setUnit={setUnit}
              />
            </FieldGroup>
          </ActionForm>
          <Button variant="destructive" onClick={() => setDeleting(true)}>
            Delete entry
          </Button>
        </>
      )}
    </div>
  );
}
export function Diary({
  entries,
  recent,
  date,
  settings,
}: {
  entries: DiaryEntry[];
  recent: DiaryEntry[];
  date: string;
  settings: Settings | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<DiaryEntry | null>(null),
    [message, setMessage] = useState("");
  const totals = { ...emptyNutrients };
  for (const e of entries) {
    const n = portionNutrition(e.snapshot, e.quantity, e.unit);
    for (const k of nutrientKeys) totals[k] += n[k];
  }
  const remaining = settings?.calories ? settings.calories - totals.calories : null;
  return (
    <>
      <PageHeading
        eyebrow="Your daily overview"
        title="Food diary"
        description="Track your meals, calories, and macros."
        action={
          <AddFoodButton
            date={date}
            recent={recent}
            onAdded={() => setMessage("Food added to your diary.")}
          />
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Previous day"
            nativeButton={false}
            render={<Link href={`/dashboard?date=${shiftDate(date, -1)}`} />}
          >
            <ArrowLeft />
          </Button>
          <label className="sr-only" htmlFor="diary-date">
            Diary date
          </label>
          <input
            id="diary-date"
            type="date"
            value={date}
            min="1900-01-01"
            max="9999-12-30"
            className="min-h-11 rounded-md border bg-background px-3 text-sm"
            onChange={(e) => {
              if (e.target.value) router.push(`/dashboard?date=${e.target.value}`);
            }}
          />
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Next day"
            nativeButton={false}
            render={<Link href={`/dashboard?date=${shiftDate(date, 1)}`} />}
          >
            <ArrowRight />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{displayDate(date)}</p>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}
      <section aria-label="Daily nutrition" className="grid gap-4 lg:grid-cols-[1.15fr_2fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily calories
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatNumber(totals.calories)}
              </span>
              <span className="text-sm text-muted-foreground">
                {settings?.calories ? `/ ${formatNumber(settings.calories)}` : "kcal consumed"}
              </span>
            </div>
            {settings?.calories ? (
              <>
                <Progress
                  value={Math.min(100, (totals.calories / settings.calories) * 100)}
                  aria-label="Daily calorie goal"
                />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {formatNumber(Math.abs(remaining!))} kcal
                  </span>{" "}
                  {remaining! < 0 ? "over your goal" : "remaining"}
                </p>
              </>
            ) : (
              <Link
                href="/settings"
                className="text-xs text-muted-foreground underline underline-offset-4"
              >
                Set a daily calorie goal →
              </Link>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Macronutrients
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            {(["protein", "carbs", "fat"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">{nutrientLabels[key]}</p>
                <p className="text-xl font-semibold tabular-nums sm:text-2xl">
                  {formatNumber(totals[key])}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">g</span>
                </p>
                {settings?.[key] ? (
                  <>
                    <Progress
                      value={Math.min(100, (totals[key] / settings[key]) * 100)}
                      aria-label={`${nutrientLabels[key]} goal`}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      of {formatNumber(settings[key])} g
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground">No goal set</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section aria-label="Meals" className="flex flex-col gap-4">
        {meals.map((meal) => {
          const items = entries.filter((e) => e.meal === meal),
            Icon = mealIcons[meal];
          const calories = items.reduce(
            (sum, e) => sum + portionNutrition(e.snapshot, e.quantity, e.unit).calories,
            0,
          );
          return (
            <Card key={meal} className="gap-0 overflow-hidden py-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-muted/50 py-2.5">
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm capitalize">{meal}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(calories)} kcal
                  </span>
                </div>
                <AddFoodButton
                  date={date}
                  meal={meal}
                  recent={recent}
                  onAdded={() => setMessage("Food added to your diary.")}
                />
              </CardHeader>
              <CardContent className="px-0">
                {items.length ? (
                  items.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setEditing(e)}
                      aria-label={`Edit ${e.snapshot.name}`}
                      className="flex min-h-16 w-full items-center justify-between gap-3 border-t px-5 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:bg-muted focus-visible:outline-ring"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{e.snapshot.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatNumber(e.quantity)}{" "}
                          {e.unit === "grams"
                            ? "g"
                            : e.snapshot.servingName
                              ? `× ${e.snapshot.servingName}`
                              : "servings"}
                          {e.snapshot.brand ? ` · ${e.snapshot.brand}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm tabular-nums">
                        {formatNumber(portionNutrition(e.snapshot, e.quantity, e.unit).calories)}
                        <span className="ml-1 text-xs text-muted-foreground">kcal</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title="Nothing logged yet"
                    description={`Add your ${meal} to keep your day up to date.`}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.snapshot.name}</DialogTitle>
            <DialogDescription>
              Update the portion, meal, or date. Nutrition stays as originally logged.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <EntryEditor
              entry={editing}
              onSuccess={() => {
                setEditing(null);
                setMessage("Diary updated.");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
