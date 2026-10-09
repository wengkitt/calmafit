"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { diaryEntries, foods, foodVersions, userSettings, weightEntries } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { readFoods, readFoodVersions } from "./data";
import { portionNutrition, type Nutrition } from "./nutrition";
import {
  InputError,
  dateValue,
  mealValue,
  numberValue,
  nutritionValue,
  textValue,
  timezoneValue,
  unitValue,
} from "./validation";

export type ActionResult = { ok: boolean; message: string; errors?: Record<string, string> };
async function run(
  paths: string[],
  work: (userId: string) => Promise<void>,
): Promise<ActionResult> {
  const { user } = await requireSession();
  try {
    await work(user.id);
  } catch (error) {
    if (error instanceof InputError)
      return { ok: false, message: error.message, errors: { [error.field]: error.message } };
    return { ok: false, message: "Couldn’t save your changes. Please try again." };
  }
  for (const path of paths) revalidatePath(path);
  return { ok: true, message: "Changes saved." };
}
function requestId(data: FormData, userId: string) {
  const id = textValue(data, "requestId");
  if (!/^[0-9a-f-]{36}$/i.test(id))
    throw new InputError("requestId", "Please reopen the form and try again.");
  return `${userId}:${id}`;
}
async function publication(nutrition: Nutrition, foodId: string, id: string) {
  const db = getDb();
  if (foodId) {
    const [existing] = await db.select().from(foods).where(eq(foods.id, foodId));
    if (!existing) throw new InputError("foodId", "This food was not found. Choose another food.");
    nutrition = { ...nutrition, name: existing.name, brand: existing.brand };
  }
  return { nutrition, foodId: foodId || `food:${id}`, versionId: `version:${id}`, isNew: !foodId };
}
export async function searchFoods(query: string) {
  return readFoods(typeof query === "string" ? query : "");
}
export async function loadFoodVersions(foodId: string) {
  return readFoodVersions(foodId);
}
export async function publishFood(data: FormData): Promise<ActionResult> {
  return run(["/foods"], async (userId) => {
    const id = requestId(data, userId);
    const [alreadyPublished] = await getDb()
      .select({ id: foodVersions.id })
      .from(foodVersions)
      .where(eq(foodVersions.id, `version:${id}`));
    if (alreadyPublished) return;
    const foodId = textValue(data, "foodId", false);
    if (!foodId && data.get("publicationChoice") !== "new")
      throw new InputError("publicationChoice", "Choose an existing food or create a new one.");
    const p = await publication(nutritionValue(data), foodId, id);
    const db = getDb();
    const version = db
      .insert(foodVersions)
      .values({ id: p.versionId, foodId: p.foodId, nutrition: p.nutrition })
      .onConflictDoNothing();
    if (p.isNew)
      await db.batch([
        db
          .insert(foods)
          .values({ id: p.foodId, name: p.nutrition.name, brand: p.nutrition.brand })
          .onConflictDoNothing(),
        version,
      ]);
    else await version;
  });
}
export async function saveDiary(data: FormData): Promise<ActionResult> {
  const paths = ["/dashboard"];
  if (
    !data.get("entryId") &&
    !data.get("versionId") &&
    !data.get("recentId") &&
    data.get("publish") === "on"
  )
    paths.push("/foods");
  return run(paths, async (userId) => {
    const db = getDb();
    const date = dateValue(data),
      meal = mealValue(data),
      unit = unitValue(data);
    const quantity = numberValue(data, "quantity", true)!;
    const editId = textValue(data, "entryId", false);
    if (editId) {
      const [entry] = await db
        .select()
        .from(diaryEntries)
        .where(and(eq(diaryEntries.id, editId), eq(diaryEntries.userId, userId)));
      if (!entry) throw new InputError("entryId", "This diary entry was not found.");
      try {
        portionNutrition(entry.snapshot, quantity, unit);
      } catch (e) {
        throw new InputError("quantity", (e as Error).message);
      }
      await db
        .update(diaryEntries)
        .set({ date, meal, quantity, unit })
        .where(and(eq(diaryEntries.id, editId), eq(diaryEntries.userId, userId)));
      return;
    }
    const id = requestId(data, userId);
    const [alreadyLogged] = await db
      .select({ id: diaryEntries.id })
      .from(diaryEntries)
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)));
    if (alreadyLogged) return;
    let snapshot: Nutrition,
      sourceVersionId: string | null = null;
    const versionId = textValue(data, "versionId", false),
      recentId = textValue(data, "recentId", false);
    if (versionId) {
      const [version] = await db.select().from(foodVersions).where(eq(foodVersions.id, versionId));
      if (!version) throw new InputError("versionId", "Choose an available nutrition version.");
      snapshot = version.nutrition;
      sourceVersionId = version.id;
    } else if (recentId) {
      const [recent] = await db
        .select()
        .from(diaryEntries)
        .where(and(eq(diaryEntries.id, recentId), eq(diaryEntries.userId, userId)));
      if (!recent) throw new InputError("recentId", "This recent food was not found.");
      snapshot = recent.snapshot;
      sourceVersionId = recent.sourceVersionId;
    } else snapshot = nutritionValue(data);
    let p: Awaited<ReturnType<typeof publication>> | undefined;
    if (!versionId && !recentId && data.get("publish") === "on") {
      const foodId = textValue(data, "foodId", false);
      if (!foodId && data.get("publicationChoice") !== "new")
        throw new InputError("publicationChoice", "Choose an existing food or create a new one.");
      p = await publication(snapshot, foodId, id);
      snapshot = p.nutrition;
      sourceVersionId = p.versionId;
    }
    try {
      portionNutrition(snapshot, quantity, unit);
    } catch (e) {
      throw new InputError("quantity", (e as Error).message);
    }
    const entry = db
      .insert(diaryEntries)
      .values({ id, userId, date, meal, unit, quantity, snapshot, sourceVersionId })
      .onConflictDoNothing();
    if (p) {
      const version = db
        .insert(foodVersions)
        .values({ id: p.versionId, foodId: p.foodId, nutrition: snapshot })
        .onConflictDoNothing();
      if (p.isNew)
        await db.batch([
          db
            .insert(foods)
            .values({ id: p.foodId, name: snapshot.name, brand: snapshot.brand })
            .onConflictDoNothing(),
          version,
          entry,
        ]);
      else await db.batch([version, entry]);
    } else await entry;
  });
}
export async function deleteDiary(data: FormData): Promise<ActionResult> {
  return run(["/dashboard"], async (userId) => {
    await getDb()
      .delete(diaryEntries)
      .where(and(eq(diaryEntries.id, textValue(data, "entryId")), eq(diaryEntries.userId, userId)));
  });
}
export async function saveWeight(data: FormData): Promise<ActionResult> {
  return run(["/weight"], async (userId) => {
    const date = dateValue(data),
      kilograms = numberValue(data, "kilograms", true, false, 1000)!;
    await getDb()
      .insert(weightEntries)
      .values({ id: crypto.randomUUID(), userId, date, kilograms })
      .onConflictDoUpdate({
        target: [weightEntries.userId, weightEntries.date],
        set: { kilograms },
      });
  });
}
export async function deleteWeight(data: FormData): Promise<ActionResult> {
  return run(["/weight"], async (userId) => {
    await getDb()
      .delete(weightEntries)
      .where(and(eq(weightEntries.userId, userId), eq(weightEntries.date, dateValue(data))));
  });
}
export async function saveSettings(data: FormData): Promise<ActionResult> {
  return run(["/settings", "/dashboard", "/weight"], async (userId) => {
    const values = {
      userId,
      timezone: timezoneValue(textValue(data, "timezone")),
      calories: numberValue(data, "calories", true, true),
      protein: numberValue(data, "protein", true, true),
      carbs: numberValue(data, "carbs", true, true),
      fat: numberValue(data, "fat", true, true),
      targetWeight: numberValue(data, "targetWeight", true, true, 1000),
    };
    await getDb()
      .insert(userSettings)
      .values(values)
      .onConflictDoUpdate({ target: userSettings.userId, set: values });
  });
}
export async function initializeTimezone(timezone: string): Promise<ActionResult> {
  return run(["/settings", "/dashboard", "/weight"], async (userId) => {
    timezoneValue(timezone);
    await getDb().insert(userSettings).values({ userId, timezone }).onConflictDoNothing();
  });
}
