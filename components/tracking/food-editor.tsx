"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { InputField, SelectField, ActionForm } from "./forms";
import { EmptyState } from "./states";
import { searchFoods, loadFoodVersions, saveDiary, publishFood } from "@/lib/tracking/actions";
import type { DiaryEntry, FoodSummary, FoodVersion } from "@/lib/tracking/data";
import {
  formatNumber,
  meals,
  nutrientKeys,
  nutrientLabels,
  portionNutrition,
  type Meal,
  type Nutrition,
  type PortionUnit,
} from "@/lib/tracking/nutrition";

type Draft = Record<
  | "name"
  | "brand"
  | "basis"
  | "servingName"
  | "servingGrams"
  | "calories"
  | "protein"
  | "carbs"
  | "fat",
  string
>;
const initialDraft: Draft = {
  name: "",
  brand: "",
  basis: "100g",
  servingName: "",
  servingGrams: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
};
function draftNutrition(d: Draft): Nutrition {
  return {
    name: d.name,
    brand: d.brand || null,
    basis: d.basis as Nutrition["basis"],
    servingName: d.servingName || null,
    servingGrams: d.servingGrams ? Number(d.servingGrams) : null,
    calories: Number(d.calories),
    protein: Number(d.protein),
    carbs: Number(d.carbs),
    fat: Number(d.fat),
  };
}
export function useFoodSearch(query: string, enabled = true) {
  const normalizedQuery = query.trim().slice(0, 200);
  const [state, setState] = useState<{
    query: string;
    attempt: number;
    results: FoodSummary[];
    error: boolean;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const timer = setTimeout(() => {
      searchFoods(normalizedQuery)
        .then((data) => {
          if (live)
            setState({ query: normalizedQuery, attempt: retry, results: data, error: false });
        })
        .catch(() => {
          if (live) setState({ query: normalizedQuery, attempt: retry, results: [], error: true });
        });
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [normalizedQuery, retry, enabled]);
  const current = state?.query === normalizedQuery && state.attempt === retry ? state : null;
  return {
    results: current?.results ?? [],
    loading: enabled && !current,
    error: current?.error ?? false,
    retry: () => setRetry((v) => v + 1),
  };
}
function FoodVersions({
  foodId,
  onSelect,
}: {
  foodId: string;
  onSelect?: (version: FoodVersion) => void;
}) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{
    foodId: string;
    attempt: number;
    versions: FoodVersion[];
    error: boolean;
  } | null>(null);
  useEffect(() => {
    let live = true;
    loadFoodVersions(foodId)
      .then((versions) => {
        if (live) setState({ foodId, attempt: retry, versions, error: false });
      })
      .catch(() => {
        if (live) setState({ foodId, attempt: retry, versions: [], error: true });
      });
    return () => {
      live = false;
    };
  }, [foodId, retry]);
  if (!state || state.foodId !== foodId || state.attempt !== retry)
    return <Skeleton className="h-24 w-full" aria-label="Loading nutrition versions" />;
  if (state.error)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Couldn’t load nutrition versions.{" "}
          <Button type="button" variant="link" onClick={() => setRetry((v) => v + 1)}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  if (!state.versions.length)
    return (
      <EmptyState
        title="No nutrition versions yet"
        description="Contribute a version to get started."
      />
    );
  return (
    <div className="flex flex-col gap-3">
      {state.versions.map((version) => {
        const content = (
          <div className="flex flex-col gap-2">
            <NutritionSummary nutrition={version.nutrition} />
            <p className="text-xs text-muted-foreground">
              Added {new Date(version.createdAt).toLocaleDateString("en", { timeZone: "UTC" })}
            </p>
          </div>
        );
        return onSelect ? (
          <Button
            key={version.id}
            variant="outline"
            className="h-auto justify-start py-3 text-left whitespace-normal"
            onClick={() => onSelect(version)}
          >
            {content}
          </Button>
        ) : (
          <div key={version.id} className="rounded-lg border p-4">
            {content}
          </div>
        );
      })}
    </div>
  );
}
export function NutritionSummary({ nutrition }: { nutrition: Nutrition }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm tabular-nums">
        <span className="font-medium">{formatNumber(nutrition.calories)} kcal</span>
        <span className="text-muted-foreground">
          {" "}
          · P {formatNumber(nutrition.protein)} · C {formatNumber(nutrition.carbs)} · F{" "}
          {formatNumber(nutrition.fat)} g
        </span>
      </p>
      <p className="text-xs text-muted-foreground">
        Per {nutrition.basis === "100g" ? "100 g" : nutrition.servingName}
        {nutrition.servingGrams ? ` · ${nutrition.servingGrams} g / serving` : ""}
      </p>
    </div>
  );
}
function NutritionFields({
  draft,
  setDraft,
  readOnlyIdentity = false,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  readOnlyIdentity?: boolean;
}) {
  const update =
    (key: keyof Draft) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft({ ...draft, [key]: event.target.value });
  return (
    <FieldGroup>
      <InputField
        label="Food name"
        name="name"
        readOnly={readOnlyIdentity}
        value={draft.name}
        onChange={update("name")}
        placeholder="e.g. Greek yogurt"
        required
        maxLength={200}
      />
      <InputField
        label="Brand (optional)"
        name="brand"
        readOnly={readOnlyIdentity}
        value={draft.brand}
        onChange={update("brand")}
        placeholder="e.g. Farm Fresh"
        maxLength={200}
      />
      <SelectField
        label="Nutrition is listed per"
        name="basis"
        value={draft.basis}
        onChange={update("basis")}
      >
        <option value="100g">100 grams</option>
        <option value="serving">One serving</option>
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label={draft.basis === "serving" ? "Serving name" : "Serving name (optional)"}
          name="servingName"
          value={draft.servingName}
          onChange={update("servingName")}
          required={draft.basis === "serving"}
          placeholder="e.g. 1 bowl"
        />
        <InputField
          label="Grams per serving (optional)"
          name="servingGrams"
          type="number"
          inputMode="decimal"
          min="0.001"
          max="1000000"
          step="any"
          value={draft.servingGrams}
          onChange={update("servingGrams")}
          placeholder="e.g. 150"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {nutrientKeys.map((key) => (
          <InputField
            key={key}
            label={`${nutrientLabels[key]} (${key === "calories" ? "kcal" : "g"})`}
            name={key}
            type="number"
            inputMode="decimal"
            required
            min="0"
            max="1000000"
            step="any"
            value={draft[key]}
            onChange={update(key)}
            placeholder="0"
          />
        ))}
      </div>
    </FieldGroup>
  );
}
function PublicationMatch({
  name,
  choice,
  setChoice,
}: {
  name: string;
  choice: string;
  setChoice: (id: string) => void;
}) {
  const { results, loading, error, retry } = useFoodSearch(name, !!name.trim());
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Check for an existing food before adding a new one. Published information stays available to
        everyone.
      </p>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>
            Couldn’t load matches.{" "}
            <Button type="button" variant="link" onClick={retry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <SelectField
        label={loading ? "Checking the food bank…" : "Publish as"}
        name="publicationChoice"
        value={choice}
        required
        onChange={(e) => setChoice(e.target.value)}
        disabled={loading || error}
      >
        <option value="">Choose an existing food or create a new one</option>
        <option value="new">Create a new food</option>
        {results.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
            {f.brand ? ` · ${f.brand}` : ""} — add a version
          </option>
        ))}
      </SelectField>
      <input type="hidden" name="foodId" value={choice === "new" ? "" : choice} />
    </div>
  );
}
export function PortionFields({
  nutrition,
  quantity,
  setQuantity,
  unit,
  setUnit,
}: {
  nutrition: Nutrition;
  quantity: string;
  setQuantity: (v: string) => void;
  unit: PortionUnit;
  setUnit: (u: PortionUnit) => void;
}) {
  let preview: ReturnType<typeof portionNutrition> | undefined;
  try {
    preview = portionNutrition(nutrition, Number(quantity), unit);
  } catch {
    /* Invalid portions are explained by form validation. */
  }
  const grams = nutrition.basis === "100g" || !!nutrition.servingGrams;
  const servings = nutrition.basis === "serving" || !!nutrition.servingGrams;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Amount"
          name="quantity"
          type="number"
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0.001"
          max="1000000"
          step="any"
          required
        />
        <SelectField
          label="Unit"
          name="unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value as PortionUnit)}
        >
          {grams && <option value="grams">Grams</option>}
          {servings && <option value="servings">Servings</option>}
        </SelectField>
      </div>
      {preview && (
        <div className="rounded-lg bg-muted p-4" aria-live="polite">
          <p className="mb-1 text-xs text-muted-foreground">For this portion</p>
          <p className="font-medium tabular-nums">
            {formatNumber(preview.calories)} kcal{" "}
            <span className="text-xs font-normal text-muted-foreground">
              · P {formatNumber(preview.protein)} · C {formatNumber(preview.carbs)} · F{" "}
              {formatNumber(preview.fat)} g
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
export function MealField({ defaultValue }: { defaultValue: Meal }) {
  return (
    <SelectField label="Meal" name="meal" defaultValue={defaultValue}>
      {meals.map((meal) => (
        <option key={meal} value={meal}>
          {meal[0].toUpperCase() + meal.slice(1)}
        </option>
      ))}
    </SelectField>
  );
}
export function FoodComposer({
  date,
  meal = "breakfast",
  recent = [],
  onSuccess,
  bankOnly = false,
  food,
}: {
  date?: string;
  meal?: Meal;
  recent?: DiaryEntry[];
  onSuccess: () => void;
  bankOnly?: boolean;
  food?: FoodSummary;
}) {
  const [mode, setMode] = useState(bankOnly ? "manual" : "search"),
    [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodSummary | null>(null);
  const [source, setSource] = useState<{
    nutrition: Nutrition;
    versionId?: string;
    recentId?: string;
  } | null>(null);
  const [draft, setDraft] = useState<Draft>({
    ...initialDraft,
    name: food?.name ?? "",
    brand: food?.brand ?? "",
  });
  const [publish, setPublish] = useState(bankOnly),
    [choice, setChoice] = useState(food?.id ?? "");
  const [quantity, setQuantity] = useState("100"),
    [unit, setUnit] = useState<PortionUnit>("grams");
  const search = useFoodSearch(query, mode === "search" && !source && !selectedFood);
  const nutrition = source?.nutrition ?? draftNutrition(draft);
  function pick(n: Nutrition, ids: { versionId?: string; recentId?: string }) {
    setSource({ nutrition: n, ...ids });
    setUnit(n.basis === "100g" ? "grams" : "servings");
    setQuantity(n.basis === "100g" ? "100" : "1");
  }
  return (
    <div className="flex flex-col gap-5">
      {!bankOnly && !source && (
        <SelectField
          label="Add food from"
          name="mode"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            setSelectedFood(null);
          }}
        >
          <option value="search">Search food bank</option>
          <option value="recent">Recent foods</option>
          <option value="manual">Enter manually</option>
        </SelectField>
      )}
      {mode === "search" && !source && (
        <>
          <InputField
            label="Search foods or brands"
            name="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedFood(null);
            }}
            placeholder="Search the shared food bank…"
          />
          {search.loading && !selectedFood ? (
            <Skeleton className="h-24 w-full" />
          ) : search.error ? (
            <Alert variant="destructive">
              <AlertDescription>
                Couldn’t search foods. <Button onClick={search.retry}>Retry</Button>
              </AlertDescription>
            </Alert>
          ) : selectedFood ? (
            <div className="flex flex-col gap-3">
              <Button variant="ghost" onClick={() => setSelectedFood(null)}>
                ← All results
              </Button>
              <h3 className="font-medium">{selectedFood.name}</h3>
              <p className="text-xs text-muted-foreground">
                Choose the nutrition version you want to log.
              </p>
              <FoodVersions
                key={selectedFood.id}
                foodId={selectedFood.id}
                onSelect={(v) => pick(v.nutrition, { versionId: v.id })}
              />
            </div>
          ) : search.results.length ? (
            <div className="flex flex-col gap-2">
              {search.results.map((f) => (
                <Button
                  key={f.id}
                  variant="outline"
                  className="h-auto justify-between py-3 whitespace-normal"
                  onClick={() => setSelectedFood(f)}
                >
                  <span className="text-left">
                    {f.name}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {f.brand || "Unbranded"}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{f.versionCount} versions →</span>
                </Button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No foods found"
              description="Try another search, or enter a food manually to get started."
            />
          )}
        </>
      )}
      {mode === "recent" && !source && (
        <div className="flex flex-col gap-2">
          {recent.length ? (
            recent.map((e) => (
              <Button
                key={e.id}
                variant="outline"
                className="h-auto justify-start py-3 whitespace-normal text-left"
                onClick={() => pick(e.snapshot, { recentId: e.id })}
              >
                <div>
                  <p className="mb-1 font-medium">{e.snapshot.name}</p>
                  <NutritionSummary nutrition={e.snapshot} />
                </div>
              </Button>
            ))
          ) : (
            <EmptyState
              title="Your next meal starts here"
              description="Foods you log will appear here for quick reuse. Private entries stay private."
            />
          )}
        </div>
      )}
      {(mode === "manual" || source) && (
        <ActionForm
          action={bankOnly ? publishFood : saveDiary}
          submitLabel={bankOnly ? "Publish nutrition version" : "Add to diary"}
          onSuccess={onSuccess}
        >
          {date && <input type="hidden" name="date" value={date} />}
          {source ? (
            <>
              <input type="hidden" name="versionId" value={source.versionId ?? ""} />
              <input type="hidden" name="recentId" value={source.recentId ?? ""} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="mb-2 font-medium">{nutrition.name}</h3>
                  <NutritionSummary nutrition={nutrition} />
                </div>
                <Button type="button" variant="ghost" onClick={() => setSource(null)}>
                  Change
                </Button>
              </div>
            </>
          ) : (
            <>
              <NutritionFields
                draft={draft}
                readOnlyIdentity={!!food}
                setDraft={(d) => {
                  if (!d.servingGrams && d.basis === draft.basis)
                    setUnit(d.basis === "100g" ? "grams" : "servings");
                  if (d.basis !== draft.basis) {
                    setUnit(d.basis === "100g" ? "grams" : "servings");
                    setQuantity(d.basis === "100g" ? "100" : "1");
                  }
                  if (d.name !== draft.name || d.brand !== draft.brand) setChoice(food?.id ?? "");
                  setDraft(d);
                }}
              />
              {!bankOnly && (
                <Field orientation="horizontal">
                  <Checkbox
                    id="publish-food"
                    name="publish"
                    value="on"
                    checked={publish}
                    onCheckedChange={setPublish}
                  />
                  <FieldLabel htmlFor="publish-food">Also add to the shared food bank</FieldLabel>
                </Field>
              )}
              {publish &&
                (food ? (
                  <>
                    <input type="hidden" name="foodId" value={food.id} />
                    <p className="text-xs text-muted-foreground">
                      Adds an immutable version to {food.name}. Existing versions stay available.
                    </p>
                  </>
                ) : (
                  <PublicationMatch name={draft.name} choice={choice} setChoice={setChoice} />
                ))}
              {!publish && (
                <p className="text-xs text-muted-foreground">
                  Only saved to your diary. You can reuse it from recent foods.
                </p>
              )}
            </>
          )}
          {!bankOnly && (
            <FieldGroup>
              <MealField defaultValue={meal} />
              <PortionFields
                nutrition={nutrition}
                quantity={quantity}
                setQuantity={setQuantity}
                unit={unit}
                setUnit={setUnit}
              />
            </FieldGroup>
          )}
        </ActionForm>
      )}
    </div>
  );
}
export function AddFoodButton({
  date,
  meal,
  recent,
  onAdded,
}: {
  date: string;
  meal?: Meal;
  recent: DiaryEntry[];
  onAdded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        size={meal ? "sm" : "lg"}
        variant={meal ? "ghost" : "default"}
      >
        <Plus data-icon="inline-start" />
        {meal ? "Add" : "Add food"}
      </Button>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add food</DialogTitle>
          <DialogDescription>
            Find a food or enter your own nutrition information.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <FoodComposer
            date={date}
            meal={meal}
            recent={recent}
            onSuccess={() => {
              setOpen(false);
              onAdded?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
export function FoodBank({ initialFoods }: { initialFoods: FoodSummary[] }) {
  const [query, setQuery] = useState(""),
    [inspecting, setInspecting] = useState<FoodSummary | null>(null);
  const [editor, setEditor] = useState<{ food?: FoodSummary } | null>(null),
    [message, setMessage] = useState("");
  const hasQuery = !!query.trim();
  const search = useFoodSearch(query, hasQuery);
  const results = hasQuery ? search.results : initialFoods;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <InputField
            label="Search the food bank"
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Food name or brand"
          />
        </div>
        <Button size="lg" onClick={() => setEditor({})}>
          <Plus data-icon="inline-start" />
          New food
        </Button>
      </div>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      {hasQuery && search.loading ? (
        <Skeleton className="h-40 w-full" />
      ) : hasQuery && search.error ? (
        <Alert variant="destructive">
          <AlertDescription>
            Couldn’t search the food bank. <Button onClick={search.retry}>Retry</Button>
          </AlertDescription>
        </Alert>
      ) : results.length ? (
        <div className="overflow-hidden rounded-lg border">
          <div className="flex justify-between bg-muted/50 px-5 py-3 text-xs text-muted-foreground">
            <span>Food / brand</span>
            <span>Nutrition versions</span>
          </div>
          {results.map((f) => (
            <button
              key={f.id}
              onClick={() => setInspecting(f)}
              className="flex min-h-16 w-full items-center justify-between gap-4 border-t px-5 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-ring"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.brand || "Unbranded"}</p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">{f.versionCount} →</span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title={query ? "No matching foods" : "A food bank we build together"}
          description={
            query
              ? "Try a different name or add this food to the bank."
              : "Add the first food with its calories and macros. Everyone can contribute nutrition versions."
          }
        />
      )}
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Search className="size-3.5" />
        Showing up to 30 foods. Search to narrow your results.
      </p>
      <Dialog
        open={!!inspecting}
        onOpenChange={(open) => {
          if (!open) setInspecting(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{inspecting?.name}</DialogTitle>
            <DialogDescription>
              {inspecting?.brand || "Unbranded"} · Community-contributed nutrition
            </DialogDescription>
          </DialogHeader>
          {inspecting && <FoodVersions key={inspecting.id} foodId={inspecting.id} />}
          <Button
            onClick={() => {
              if (inspecting) setEditor({ food: inspecting });
              setInspecting(null);
            }}
          >
            <Plus data-icon="inline-start" />
            Contribute a version
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editor?.food ? "Add nutrition version" : "Add to the food bank"}
            </DialogTitle>
            <DialogDescription>Publish nutrition per 100 grams or per serving.</DialogDescription>
          </DialogHeader>
          {editor && (
            <FoodComposer
              bankOnly
              food={editor.food}
              onSuccess={() => {
                setEditor(null);
                setMessage("Nutrition version published to the food bank.");
                search.retry();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
