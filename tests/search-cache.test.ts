import assert from "node:assert/strict";
import { test } from "node:test";
import { createSearchCache } from "../lib/tracking/search-cache";

test("reopening a food search reuses results, including empty results, until expiry", async () => {
  let calls = 0;
  let now = 0;
  const cache = createSearchCache(
    async () => {
      calls++;
      return [];
    },
    { ttl: 100, now: () => now },
  );
  const first = await cache.load("");
  assert.equal(cache.peek(""), first);
  assert.equal(await cache.load(""), first);
  assert.equal(calls, 1);
  now = 100;
  assert.equal(cache.peek(""), undefined);
  await cache.load("");
  assert.equal(calls, 2);
});

test("simultaneous searches share a request and rejected requests can retry", async () => {
  let calls = 0;
  const cache = createSearchCache(async () => {
    if (++calls === 1) throw new Error("offline");
    return ["food"];
  });
  const first = cache.load("egg");
  assert.equal(cache.load("egg"), first);
  await assert.rejects(first, /offline/);
  assert.deepEqual(await cache.load("egg"), ["food"]);
  assert.equal(calls, 2);
});

test("publication invalidation notifies consumers and discards pending stale results", async () => {
  let resolve!: (value: string[]) => void;
  let notifications = 0;
  const cache = createSearchCache(
    () =>
      new Promise<string[]>((done) => {
        resolve = done;
      }),
  );
  const unsubscribe = cache.subscribe(() => notifications++);
  const request = cache.load("");
  await Promise.resolve();
  cache.clear();
  resolve(["outdated food"]);
  await request;
  assert.equal(cache.peek(""), undefined);
  assert.equal(notifications, 1);
  unsubscribe();
  cache.clear();
  assert.equal(notifications, 1);
});

test("search cache bounds the number of stored queries", async () => {
  const cache = createSearchCache(async (query) => [query], { limit: 2 });
  await cache.load("one");
  await cache.load("two");
  await cache.load("three");
  assert.equal(cache.peek("one"), undefined);
  assert.deepEqual(cache.peek("three"), ["three"]);
});
