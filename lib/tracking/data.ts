import "server-only";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { diaryEntries, foods, foodVersions, userSettings, weightEntries } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { dateInTimezone, validDate } from "./nutrition";

export type FoodResult = typeof foods.$inferSelect & {
  versions: (typeof foodVersions.$inferSelect)[];
};
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type Settings = typeof userSettings.$inferSelect;
export type WeightEntry = typeof weightEntries.$inferSelect;

export async function readFoods(query = ""): Promise<FoodResult[]> {
  await requireSession();
  const db = getDb();
  const escaped = query
    .trim()
    .slice(0, 200)
    .replace(/[\\%_]/g, "\\$&");
  const results = await db
    .select()
    .from(foods)
    .where(
      escaped
        ? or(ilike(foods.name, `%${escaped}%`), ilike(foods.brand, `%${escaped}%`))
        : undefined,
    )
    .orderBy(desc(foods.createdAt), foods.id)
    .limit(30);
  if (!results.length) return [];
  const versions = await db
    .select()
    .from(foodVersions)
    .where(
      inArray(
        foodVersions.foodId,
        results.map((f) => f.id),
      ),
    )
    .orderBy(desc(foodVersions.createdAt), foodVersions.id);
  const grouped = new Map<string, FoodResult["versions"]>();
  for (const version of versions)
    grouped.set(version.foodId, [...(grouped.get(version.foodId) ?? []), version]);
  return results.map((food) => ({ ...food, versions: grouped.get(food.id) ?? [] }));
}
export async function readSettings(): Promise<Settings | null> {
  const { user } = await requireSession();
  const [settings] = await getDb()
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id));
  return settings ?? null;
}
export async function readDiary(requestedDate?: string) {
  const { user } = await requireSession();
  const settings = await readSettings();
  const date =
    requestedDate && validDate(requestedDate)
      ? requestedDate
      : dateInTimezone(settings?.timezone ?? "UTC");
  const [entries, recent] = await Promise.all([
    getDb()
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, user.id), eq(diaryEntries.date, date)))
      .orderBy(diaryEntries.createdAt),
    getDb()
      .select()
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, user.id))
      .orderBy(desc(diaryEntries.createdAt))
      .limit(30),
  ]);
  const seen = new Set<string>();
  const uniqueRecent = recent
    .filter((e) => {
      const key = JSON.stringify(e.snapshot);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
  return { entries, recent: uniqueRecent, settings, date };
}
export async function readWeight() {
  const { user } = await requireSession();
  const [entries, settings] = await Promise.all([
    getDb()
      .select()
      .from(weightEntries)
      .where(eq(weightEntries.userId, user.id))
      .orderBy(desc(weightEntries.date)),
    readSettings(),
  ]);
  return { entries, settings, today: dateInTimezone(settings?.timezone ?? "UTC") };
}
