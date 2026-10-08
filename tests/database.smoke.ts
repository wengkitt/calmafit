// Uses the configured database. All fixture rows are removed within the same atomic batch.
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
async function main() {
  loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const sql = neon(process.env.DATABASE_URL);
  const prefix = `calma-smoke-${crypto.randomUUID()}`;
  const a = `${prefix}-a`,
    b = `${prefix}-b`,
    foodId = `${prefix}-food`,
    v1 = `${prefix}-v1`,
    v2 = `${prefix}-v2`,
    entry = `${prefix}-entry`;
  const original = {
    name: "Smoke fixture",
    brand: null,
    basis: "100g",
    servingName: null,
    servingGrams: null,
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 2,
  };
  const result = await sql.transaction([
    sql`INSERT INTO "user" (id, name, email) VALUES (${a}, 'Smoke A', ${`${a}@example.invalid`}), (${b}, 'Smoke B', ${`${b}@example.invalid`})`,
    sql`INSERT INTO foods (id, name) VALUES (${foodId}, 'Smoke fixture')`,
    sql`INSERT INTO food_versions (id, food_id, nutrition) VALUES (${v1}, ${foodId}, ${JSON.stringify(original)}::jsonb)`,
    sql`INSERT INTO diary_entries (id, user_id, date, meal, snapshot, source_version_id, quantity, unit) VALUES (${entry}, ${a}, '2026-10-08', 'breakfast', ${JSON.stringify(original)}::jsonb, ${v1}, 150, 'grams')`,
    sql`INSERT INTO food_versions (id, food_id, nutrition) VALUES (${v2}, ${foodId}, ${JSON.stringify({ ...original, calories: 120 })}::jsonb)`,
    sql`INSERT INTO weight_entries (id, user_id, date, kilograms) VALUES (${`${prefix}-w1`}, ${a}, '2026-10-08', 75) ON CONFLICT (user_id, date) DO UPDATE SET kilograms = excluded.kilograms`,
    sql`INSERT INTO weight_entries (id, user_id, date, kilograms) VALUES (${`${prefix}-w2`}, ${a}, '2026-10-08', 74.5) ON CONFLICT (user_id, date) DO UPDATE SET kilograms = excluded.kilograms`,
    sql`SELECT snapshot->>'calories' AS calories FROM diary_entries WHERE id = ${entry} AND user_id = ${a}`,
    sql`SELECT id FROM diary_entries WHERE id = ${entry} AND user_id = ${b}`,
    sql`UPDATE diary_entries SET quantity = 999 WHERE id = ${entry} AND user_id = ${b} RETURNING id`,
    sql`SELECT quantity FROM diary_entries WHERE id = ${entry} AND user_id = ${a}`,
    sql`SELECT kilograms FROM weight_entries WHERE user_id = ${a} AND date = '2026-10-08'`,
    sql`SELECT id FROM food_versions WHERE food_id = ${foodId}`,
    sql`INSERT INTO diary_entries (id, user_id, date, meal, snapshot, quantity, unit) VALUES (${entry}, ${a}, '2026-10-08', 'breakfast', ${JSON.stringify(original)}::jsonb, 200, 'grams') ON CONFLICT DO NOTHING RETURNING id`,
    sql`DELETE FROM "user" WHERE id IN (${a}, ${b})`,
    sql`DELETE FROM food_versions WHERE food_id = ${foodId}`,
    sql`DELETE FROM foods WHERE id = ${foodId}`,
  ]);
  assert.equal(result[7][0].calories, "100", "New versions must not rewrite diary snapshots");
  assert.equal(result[8].length, 0, "Another account cannot read the scoped entry");
  assert.equal(result[9].length, 0, "Another account cannot mutate the scoped entry");
  assert.equal(result[10][0].quantity, 150);
  assert.equal(result[11][0].kilograms, 74.5, "Weight upserts replace the same day's measurement");
  assert.equal(result[12].length, 2, "Both nutrition versions remain available");
  assert.equal(result[13].length, 0, "Retries must not duplicate a diary entry");
  console.log(
    "Database smoke checks passed: snapshots, scoped queries, versions, weight upserts, idempotency. Fixtures cleaned atomically.",
  );
}
main().catch(() => {
  console.error("Database smoke check failed. Verify connectivity and migrations.");
  process.exitCode = 1;
});
