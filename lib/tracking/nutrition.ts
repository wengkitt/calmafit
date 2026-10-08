export const meals = ["breakfast", "lunch", "dinner", "snacks"] as const;
export type Meal = (typeof meals)[number];
export type PortionUnit = "grams" | "servings";
export type Nutrients = { calories: number; protein: number; carbs: number; fat: number };
export type Nutrition = Nutrients & {
  name: string;
  brand: string | null;
  basis: "100g" | "serving";
  servingName: string | null;
  servingGrams: number | null;
};
export const nutrientKeys = ["calories", "protein", "carbs", "fat"] as const;
export const nutrientLabels = {
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
};
export const emptyNutrients: Nutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };
export function portionNutrition(n: Nutrition, quantity: number, unit: PortionUnit): Nutrients {
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Enter a positive portion.");
  let factor: number;
  if (n.basis === "100g") {
    if (unit === "grams") factor = quantity / 100;
    else {
      if (!n.servingGrams) throw new Error("This food needs a serving weight to use servings.");
      factor = (quantity * n.servingGrams) / 100;
    }
  } else if (unit === "servings") factor = quantity;
  else {
    if (!n.servingGrams) throw new Error("This food needs a serving weight to use grams.");
    factor = quantity / n.servingGrams;
  }
  return Object.fromEntries(nutrientKeys.map((k) => [k, n[k] * factor])) as Nutrients;
}
export function validDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value >= "1900-01-01" &&
    value <= "9999-12-31" &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function dateInTimezone(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function displayDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(n);
}
