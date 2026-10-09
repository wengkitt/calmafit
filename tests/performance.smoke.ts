// Uses a local production server and temporary fixtures in its configured database.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { dateInTimezone, displayDate, shiftDate } from "../lib/tracking/nutrition";

async function main() {
  loadEnvConfig(process.cwd());
  const base = process.env.TEST_APP_URL ?? "http://localhost:3100";
  if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
    throw new Error("Use a local production server for this check.");
  if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET)
    throw new Error("Database and authentication configuration are required.");
  const sql = neon(process.env.DATABASE_URL);
  const id = `calmafit-perf-${crypto.randomUUID()}`;
  const token = crypto.randomUUID();
  const signature = createHmac("sha256", process.env.BETTER_AUTH_SECRET)
    .update(token)
    .digest("base64");
  const cookie = `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
  const today = dateInTimezone("UTC");
  const oldest = shiftDate(today, -399);
  const versionMarker = `${id}-nutrition-detail`;
  try {
    await sql.transaction([
      sql`INSERT INTO "user" (id, name, email) VALUES (${id}, 'Performance fixture', ${`${id}@example.invalid`})`,
      sql`INSERT INTO "session" (id, user_id, token, expires_at) VALUES (${id}, ${id}, ${token}, NOW() + INTERVAL '1 hour')`,
      sql`INSERT INTO user_settings (user_id, timezone) VALUES (${id}, 'UTC')`,
      sql`INSERT INTO foods (id, name) VALUES (${id}, ${id})`,
      sql`INSERT INTO food_versions (id, food_id, nutrition)
          SELECT ${id} || '-v-' || n, ${id}, ${JSON.stringify({ name: versionMarker, brand: null, basis: "100g", servingName: null, servingGrams: null, calories: 100, protein: 10, carbs: 10, fat: 2 })}::jsonb
          FROM generate_series(1, 100) AS n`,
      sql`INSERT INTO weight_entries (id, user_id, date, kilograms)
          SELECT ${id} || '-w-' || n, ${id}, ${today}::date - n, 70 + n * 0.01
          FROM generate_series(0, 399) AS n`,
    ]);
    const get = async (path: string) => {
      const start = performance.now();
      const response = await fetch(`${base}${path}`, { headers: { cookie } });
      const body = await response.text();
      assert.equal(response.status, 200);
      assert.ok(!body.includes("NEXT_HTTP_ERROR_FALLBACK"));
      return {
        body,
        milliseconds: Math.round(performance.now() - start),
        bytes: Buffer.byteLength(body),
      };
    };
    // Warm the server once, then report complete response times and uncompressed HTML sizes.
    await Promise.all([get("/foods"), get("/weight")]);
    for (const path of ["/dashboard", "/foods", "/weight"]) {
      const samples = [];
      for (let i = 0; i < 3; i++) samples.push(await get(path));
      const median = samples.map((s) => s.milliseconds).sort((a, b) => a - b)[1];
      console.log(`${path}: median ${median} ms, ${samples[0].bytes} HTML bytes`);
      if (!process.argv.includes("--measure-only")) {
        if (path === "/foods") {
          assert.ok(samples[0].body.includes(id), "Shared food should appear");
          assert.ok(
            samples[0].body.includes(">100<!-- -->"),
            "Food summary must count all versions",
          );
          assert.ok(
            !samples[0].body.includes(versionMarker),
            "Food summaries must not preload nutrition versions",
          );
        }
        if (path === "/weight") {
          assert.equal((samples[0].body.match(/aria-label="Edit weight for /g) ?? []).length, 30);
          assert.ok(samples[0].body.includes("Older check-ins"));
          assert.ok(
            samples[0].body.includes(">-4 kg<"),
            "Lifetime change must include the earliest measurement",
          );
          const loaded = new Set(
            [...samples[0].body.matchAll(new RegExp(`${id}-w-(\\d+)`, "g"))].map((match) =>
              Number(match[1]),
            ),
          );
          assert.equal(
            loaded.size,
            91,
            "Load only 90 chart days plus the first lifetime measurement",
          );
          assert.ok([...loaded].every((index) => index < 90 || index === 399));
        }
      }
    }
    if (!process.argv.includes("--measure-only")) {
      const manifest = JSON.parse(
        await readFile(".next/server/server-reference-manifest.json", "utf8"),
      ) as {
        node: Record<string, { exportedName: string }>;
      };
      const action = async (name: string, argument: string, authenticated = true) => {
        const entry = Object.entries(manifest.node).find(
          ([, value]) => value.exportedName === name,
        );
        assert.ok(entry, `${name} must be available in the production build`);
        const response = await fetch(`${base}/foods`, {
          method: "POST",
          headers: {
            "Next-Action": entry[0],
            "Content-Type": "text/plain;charset=UTF-8",
            origin: base,
            ...(authenticated ? { cookie } : {}),
          },
          body: JSON.stringify([argument]),
          redirect: "manual",
        });
        assert.equal(response.status, 200);
        return response.text();
      };
      const search = await action("searchFoods", id);
      assert.ok(search.includes('"versionCount":100'));
      assert.ok(!search.includes(versionMarker), "Search action must return summaries only");
      const versions = await action("loadFoodVersions", id);
      assert.equal(
        versions.split(versionMarker).length - 1,
        100,
        "Selection must load all available versions",
      );
      const anonymousVersions = await action("loadFoodVersions", id, false);
      assert.ok(
        !anonymousVersions.includes(versionMarker),
        "Version loading must require a session",
      );
      const older = await get(`/weight?before=${shiftDate(today, -29)}&range=30`);
      assert.equal((older.body.match(/aria-label="Edit weight for /g) ?? []).length, 30);
      assert.ok(!older.body.includes(`aria-label="Edit weight for ${displayDate(today)}`));
      const last = await get(`/weight?before=${shiftDate(today, -389)}`);
      assert.equal((last.body.match(/aria-label="Edit weight for /g) ?? []).length, 10);
      assert.ok(last.body.includes(oldest));
      assert.ok(!last.body.includes("Older check-ins"));
      const invalid = await get("/weight?range=999999&before=not-a-date");
      assert.equal((invalid.body.match(/aria-label="Edit weight for /g) ?? []).length, 30);
      console.log(
        "Performance regression checks passed: food summaries, on-demand authenticated versions, bounded weight history, cursor pagination, lifetime summary, and invalid query parameters.",
      );
    }
  } finally {
    await sql.transaction([
      sql`DELETE FROM "user" WHERE id = ${id}`,
      sql`DELETE FROM food_versions WHERE food_id = ${id}`,
      sql`DELETE FROM foods WHERE id = ${id}`,
    ]);
  }
}

main().catch((error: unknown) => {
  if (error instanceof assert.AssertionError) console.error(error.message);
  console.error(
    "Performance smoke check failed. Check the local production server and database configuration.",
  );
  process.exitCode = 1;
});
