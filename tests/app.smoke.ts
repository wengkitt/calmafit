// Run against the local development app with the same DATABASE_URL. Creates and cleans its own accounts.
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
async function main() {
  loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const base = process.env.TEST_APP_URL ?? "http://localhost:3000";
  if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
    throw new Error("Use a local app for this smoke check.");
  const sql = neon(process.env.DATABASE_URL);
  const prefix = `calma-app-smoke-${crypto.randomUUID()}`;
  const accounts: { id: string; cookie: string }[] = [];
  const foodId = `${prefix}-food`,
    versionId = `${prefix}-version`;
  const privateName = `${prefix}-private`,
    sharedName = `${prefix}-shared`;
  try {
    for (const suffix of ["a", "b"]) {
      const response = await fetch(`${base}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: base },
        body: JSON.stringify({
          name: "App smoke fixture",
          email: `${prefix}-${suffix}@example.invalid`,
          password: `${crypto.randomUUID()}-Aa1!`,
        }),
      });
      assert.equal(response.status, 200, "Test account signup failed");
      const data = await response.json();
      accounts.push({
        id: data.user.id,
        cookie: response.headers
          .getSetCookie()
          .map((v) => v.split(";")[0])
          .join("; "),
      });
    }
    const nutrition = {
      name: privateName,
      brand: null,
      basis: "100g",
      servingName: null,
      servingGrams: null,
      calories: 101,
      protein: 10,
      carbs: 10,
      fat: 2,
    };
    await sql.transaction([
      sql`INSERT INTO foods (id, name) VALUES (${foodId}, ${sharedName})`,
      sql`INSERT INTO food_versions (id, food_id, nutrition) VALUES (${versionId}, ${foodId}, ${JSON.stringify({ ...nutrition, name: sharedName })}::jsonb)`,
      sql`INSERT INTO diary_entries (id, user_id, date, meal, snapshot, quantity, unit) VALUES (${`${prefix}-diary`}, ${accounts[0].id}, '2026-10-08', 'breakfast', ${JSON.stringify(nutrition)}::jsonb, 100, 'grams')`,
      sql`INSERT INTO weight_entries (id, user_id, date, kilograms) VALUES (${`${prefix}-weight`}, ${accounts[0].id}, '2026-10-08', 71.234)`,
    ]);
    const get = async (path: string, cookie?: string) => {
      const response = await fetch(`${base}${path}`, {
        headers: cookie ? { cookie } : {},
        redirect: "manual",
      });
      return { response, body: await response.text() };
    };
    const [a, b, bankA, bankB, weightA, weightB, anonymous] = await Promise.all([
      get("/dashboard?date=2026-10-08", accounts[0].cookie),
      get("/dashboard?date=2026-10-08", accounts[1].cookie),
      get(`/foods`, accounts[0].cookie),
      get(`/foods`, accounts[1].cookie),
      get("/weight", accounts[0].cookie),
      get("/weight", accounts[1].cookie),
      get("/dashboard"),
    ]);
    assert.ok(a.body.includes(privateName), "Account A should see its private diary");
    assert.ok(
      !b.body.includes(privateName),
      "Account B must not receive A's diary or recent foods",
    );
    for (const bank of [bankA, bankB]) {
      assert.ok(bank.body.includes(sharedName), "Both accounts should see shared foods");
      assert.ok(
        !bank.body.includes(privateName),
        "Private foods must not appear in the shared bank",
      );
    }
    assert.ok(weightA.body.includes("71.234"));
    assert.ok(!weightB.body.includes("71.234"), "Weight records must be private");
    assert.ok(
      anonymous.response.headers.get("location")?.includes("/sign-in") ||
        anonymous.body.includes("/sign-in"),
    );
    assert.ok(!anonymous.body.includes(privateName));
    console.log(
      "App smoke checks passed: authenticated diary and weight isolation, shared food access, private food exclusion, anonymous redirect.",
    );
  } finally {
    const ids = accounts.map((a) => a.id);
    if (ids.length)
      await sql.transaction([
        sql`DELETE FROM "user" WHERE id = ANY(${ids}::text[])`,
        sql`DELETE FROM food_versions WHERE food_id = ${foodId}`,
        sql`DELETE FROM foods WHERE id = ${foodId}`,
      ]);
  }
}
main().catch(() => {
  console.error(
    "App smoke check failed. Check the local server, database, and authentication settings.",
  );
  process.exitCode = 1;
});
