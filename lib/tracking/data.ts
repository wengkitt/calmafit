import "server-only";
import { and, asc, desc, eq, getTableColumns, gte, ilike, lt, lte, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { diaryEntries, foods, foodVersions, userSettings, weightEntries } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { dateInTimezone, shiftDate, validDate } from "./nutrition";

export type FoodSummary = typeof foods.$inferSelect & { versionCount: number };
export type FoodVersion = typeof foodVersions.$inferSelect;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type Settings = typeof userSettings.$inferSelect;
export type WeightEntry = typeof weightEntries.$inferSelect;

export async function readFoods(query = ""): Promise<FoodSummary[]> {
  await requireSession();
  const db = getDb();
  const escaped = query
    .trim()
    .slice(0, 200)
    .replace(/[\\%_]/g, "\\$&");
  return db
    .select({
      ...getTableColumns(foods),
      versionCount: db.$count(foodVersions, eq(foodVersions.foodId, foods.id)),
    })
    .from(foods)
    .where(
      escaped
        ? or(ilike(foods.name, `%${escaped}%`), ilike(foods.brand, `%${escaped}%`))
        : undefined,
    )
    .orderBy(desc(foods.createdAt), foods.id)
    .limit(30);
}
export async function readFoodVersions(foodId: string): Promise<FoodVersion[]> {
  await requireSession();
  if (typeof foodId !== "string" || !foodId || foodId.length > 200) return [];
  return getDb()
    .select()
    .from(foodVersions)
    .where(eq(foodVersions.foodId, foodId))
    .orderBy(desc(foodVersions.createdAt), foodVersions.id);
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
  const settingsPromise = readSettings();
  const datePromise =
    requestedDate && validDate(requestedDate)
      ? Promise.resolve(requestedDate)
      : settingsPromise.then((settings) => dateInTimezone(settings?.timezone ?? "UTC"));
  const [settings, date, entries, recent] = await Promise.all([
    settingsPromise,
    datePromise,
    datePromise.then((date) =>
      getDb()
        .select()
        .from(diaryEntries)
        .where(and(eq(diaryEntries.userId, user.id), eq(diaryEntries.date, date)))
        .orderBy(diaryEntries.createdAt),
    ),
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
export async function readWeight(options: { range?: string; before?: string } = {}) {
  const { user } = await requireSession();
  const range = options.range === "30" || options.range === "365" ? Number(options.range) : 90;
  const before = options.before && validDate(options.before) ? options.before : undefined;
  const settingsPromise = readSettings();
  const todayPromise = settingsPromise.then((settings) =>
    dateInTimezone(settings?.timezone ?? "UTC"),
  );
  const scoped = eq(weightEntries.userId, user.id);
  const [page, settings, today, chartEntries, latestRows, firstRows] = await Promise.all([
    getDb()
      .select()
      .from(weightEntries)
      .where(and(scoped, before ? lt(weightEntries.date, before) : undefined))
      .orderBy(desc(weightEntries.date))
      .limit(31),
    settingsPromise,
    todayPromise,
    todayPromise.then((today) =>
      getDb()
        .select()
        .from(weightEntries)
        .where(
          and(
            scoped,
            gte(weightEntries.date, shiftDate(today, 1 - range)),
            lte(weightEntries.date, today),
          ),
        )
        .orderBy(desc(weightEntries.date))
        .limit(range),
    ),
    getDb().select().from(weightEntries).where(scoped).orderBy(desc(weightEntries.date)).limit(1),
    getDb().select().from(weightEntries).where(scoped).orderBy(asc(weightEntries.date)).limit(1),
  ]);
  const entries = page.slice(0, 30);
  return {
    entries,
    chartEntries,
    settings,
    today,
    range,
    before,
    nextBefore: page.length > 30 ? entries.at(-1)!.date : null,
    latest: latestRows[0] ?? null,
    first: firstRows[0] ?? null,
  };
}
