import {
  meals,
  nutrientKeys,
  validDate,
  type Meal,
  type Nutrition,
  type PortionUnit,
} from "./nutrition";
export class InputError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}
export function textValue(data: FormData, key: string, required = true): string {
  const raw = data.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  if ((required && !value) || value.length > 200)
    throw new InputError(key, "Enter a value of 1–200 characters.");
  return value;
}
export function numberValue(
  data: FormData,
  key: string,
  positive = false,
  optional = false,
  max = 1000000,
): number | null {
  const raw = textValue(data, key, !optional);
  if (!raw && optional) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value > max || (positive ? value <= 0 : value < 0)) {
    throw new InputError(
      key,
      `Enter a ${positive ? "positive" : "nonnegative"} number up to ${max}.`,
    );
  }
  return value;
}
export function dateValue(data: FormData): string {
  const value = textValue(data, "date");
  if (!validDate(value)) throw new InputError("date", "Enter a valid calendar date.");
  return value;
}
export function mealValue(data: FormData): Meal {
  const value = textValue(data, "meal");
  if (!meals.includes(value as Meal)) throw new InputError("meal", "Choose a meal.");
  return value as Meal;
}
export function unitValue(data: FormData): PortionUnit {
  const value = textValue(data, "unit");
  if (value !== "grams" && value !== "servings")
    throw new InputError("unit", "Choose grams or servings.");
  return value;
}
export function nutritionValue(data: FormData): Nutrition {
  const name = textValue(data, "name");
  const brand = textValue(data, "brand", false) || null;
  const basis = textValue(data, "basis");
  if (basis !== "100g" && basis !== "serving")
    throw new InputError("basis", "Choose a nutrition basis.");
  const servingName = textValue(data, "servingName", basis === "serving") || null;
  const servingGrams = numberValue(data, "servingGrams", true, true);
  const nutrients = Object.fromEntries(nutrientKeys.map((k) => [k, numberValue(data, k)]));
  return { name, brand, basis, servingName, servingGrams, ...nutrients } as Nutrition;
}
export function timezoneValue(value: string): string {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
  } catch {
    throw new InputError("timezone", "Enter a valid timezone, such as Asia/Kuala_Lumpur.");
  }
  return value;
}
