import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dateInTimezone,
  displayDate,
  displayTimestamp,
  formatNumber,
  portionNutrition,
  shiftDate,
  validDate,
  type Nutrition,
} from "../lib/tracking/nutrition";
import {
  dateValue,
  mealValue,
  numberValue,
  nutritionValue,
  timezoneValue,
  unitValue,
} from "../lib/tracking/validation";
const food: Nutrition = {
  name: "Test food",
  brand: null,
  basis: "100g",
  servingName: "bowl",
  servingGrams: 150,
  calories: 123.456,
  protein: 8,
  carbs: 16,
  fat: 3,
};
function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([k, v]) => data.set(k, v));
  return data;
}
test("grams scale independently entered calories and macros without rounding", () => {
  assert.deepEqual(portionNutrition(food, 150, "grams"), {
    calories: 185.184,
    protein: 12,
    carbs: 24,
    fat: 4.5,
  });
  assert.equal(food.calories, 123.456);
});
test("fractional servings use their gram weight for per-100g food", () => {
  assert.equal(portionNutrition(food, 0.5, "servings").protein, 6);
});
test("serving-based nutrition converts grams only with a known serving weight", () => {
  const serving = { ...food, basis: "serving" as const };
  assert.equal(portionNutrition(serving, 0.25, "servings").carbs, 4);
  assert.equal(portionNutrition(serving, 75, "grams").fat, 1.5);
  assert.throws(
    () => portionNutrition({ ...serving, servingGrams: null }, 75, "grams"),
    /serving weight/,
  );
  assert.equal(portionNutrition({ ...serving, servingGrams: null }, 2, "servings").protein, 16);
  assert.throws(
    () => portionNutrition({ ...food, servingGrams: null }, 1, "servings"),
    /serving weight/,
  );
});
test("zero nutrients are valid but zero, negative, and nonfinite portions are rejected", () => {
  assert.deepEqual(
    portionNutrition({ ...food, calories: 0, protein: 0, carbs: 0, fat: 0 }, 25, "grams"),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  for (const n of [0, -1, NaN, Infinity]) assert.throws(() => portionNutrition(food, n, "grams"));
});
test("rounding is for display only", () => {
  assert.equal(formatNumber(123.456), "123.5");
  assert.equal(portionNutrition(food, 100, "grams").calories, 123.456);
});
test("calendar date validation handles leap years and invalid dates without throwing", () => {
  for (const value of ["2024-02-29", "2026-10-08", "1900-01-01", "9999-12-31"])
    assert.equal(validDate(value), true);
  for (const value of [
    "2026-02-29",
    "2026-02-30",
    "2026-99-99",
    "invalid",
    "2026-1-1",
    "1899-01-01",
    "1900-02-29",
    "2026-04-31",
    "2026-00-01",
    "2026-01-00",
    "2026-10-08T00:00:00Z",
    "10000-01-01",
  ])
    assert.equal(validDate(value), false);
  assert.throws(() => dateValue(form({ date: "2026-02-30" })));
  assert.equal(shiftDate("2024-02-28", 1), "2024-02-29");
  assert.equal(shiftDate("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDate("2026-03-08", 1), "2026-03-09");
  assert.equal(shiftDate("2026-11-01", -1), "2026-10-31");
  assert.equal(shiftDate("2011-12-29", 1), "2011-12-30");
});
test("today follows timezone across midnight and DST boundaries", () => {
  const now = new Date("2026-10-08T17:00:00Z");
  assert.equal(dateInTimezone("Asia/Kuala_Lumpur", now), "2026-10-09");
  assert.equal(dateInTimezone("America/Los_Angeles", now), "2026-10-08");
  assert.equal(dateInTimezone("America/New_York", new Date("2026-03-08T07:30:00Z")), "2026-03-08");
});
test("calendar and timestamp labels retain their UTC dates", () => {
  assert.equal(displayDate("2026-10-08"), "Oct 8, 2026");
  assert.equal(displayTimestamp("2026-10-08T23:30:00Z"), "10/8/2026");
  assert.equal(displayTimestamp("2026-10-09T01:30:00+08:00"), "10/8/2026");
});
test("nutrition validation allows zero and rejects negative/nonfinite/blank values", () => {
  const values = {
    name: "Water",
    basis: "100g",
    calories: "0",
    protein: "0",
    carbs: "0",
    fat: "0",
  };
  assert.equal(nutritionValue(form(values)).calories, 0);
  for (const value of ["-1", "Infinity", "NaN", "", "1000001"])
    assert.throws(() => nutritionValue(form({ ...values, calories: value })));
  assert.throws(() => nutritionValue(form({ ...values, name: " " })));
  assert.throws(() => nutritionValue(form({ ...values, basis: "serving" })));
  assert.throws(() => nutritionValue(form({ ...values, servingGrams: "0" })));
});
test("optional goals can be cleared; values and choices are validated", () => {
  assert.equal(numberValue(form({ protein: "" }), "protein", true, true), null);
  for (const value of ["-1", "0", "Infinity"])
    assert.throws(() => numberValue(form({ protein: value }), "protein", true, true));
  assert.throws(() => numberValue(form({ kilograms: "1001" }), "kilograms", true, false, 1000));
  assert.equal(mealValue(form({ meal: "snacks" })), "snacks");
  assert.throws(() => mealValue(form({ meal: "other" })));
  assert.throws(() => unitValue(form({ unit: "cups" })));
  assert.equal(timezoneValue("Asia/Kuala_Lumpur"), "Asia/Kuala_Lumpur");
  assert.throws(() => timezoneValue("not-a-timezone"));
});

test("weight chart inserts gaps without expanding long measurement-free periods", async () => {
  const { weightPoints, chartDateLabel } = await import("../lib/tracking/chart");
  const points = weightPoints([
    { date: "2026-10-08", kilograms: 73 },
    { date: "2026-10-04", kilograms: 74 },
    { date: "2026-10-03", kilograms: 75 },
  ]);
  assert.deepEqual(
    points.map((p) => p.kilograms),
    [75, 74, null, 73],
  );
  assert.equal(chartDateLabel(1791417600000), "Oct 8, 2026");
  assert.equal(points[0].date, 1790985600000);
  assert.equal(chartDateLabel(1791417600000, "MMM d"), "Oct 8");
  for (const invalid of [undefined, null, NaN, Infinity, 1e20, "Weight (kg)"])
    assert.equal(chartDateLabel(invalid), "Weight");
});
