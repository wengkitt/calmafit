import { utc } from "@date-fns/utc";
import { tz } from "@date-fns/tz/tz";
import { addDays } from "date-fns/addDays";
import { format } from "date-fns/format";
import { isValid } from "date-fns/isValid";
import { parseISO } from "date-fns/parseISO";

// Stored calendar dates must not depend on the server or browser timezone.
const utcOptions = { in: utc };

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
    isValid(parseISO(value, utcOptions))
  );
}
export function dateInTimezone(timezone: string, now = new Date()): string {
  return format(now, "yyyy-MM-dd", { in: tz(timezone) });
}
export function shiftDate(date: string, days: number): string {
  return format(addDays(parseISO(date, utcOptions), days, utcOptions), "yyyy-MM-dd", utcOptions);
}
export function displayDate(date: string): string {
  return format(parseISO(date, utcOptions), "MMM d, yyyy", utcOptions);
}
export function displayTimestamp(value: Date | string): string {
  return format(typeof value === "string" ? parseISO(value) : value, "M/d/yyyy", utcOptions);
}
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(n);
}
