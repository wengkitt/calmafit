// Browser-memory search results only; never persist diary or account data here.
export function createSearchCache<T>(
  fetcher: (query: string) => Promise<T>,
  { ttl = 300_000, limit = 50, now = Date.now } = {},
) {
  const entries = new Map<string, { data: T; expires: number }>();
  const pending = new Map<string, Promise<T>>();
  const listeners = new Set<() => void>();
  return {
    peek(query: string): T | undefined {
      const entry = entries.get(query);
      return entry && entry.expires > now() ? entry.data : undefined;
    },
    load(query: string): Promise<T> {
      const cached = this.peek(query);
      if (cached !== undefined) return Promise.resolve(cached);
      const existing = pending.get(query);
      if (existing) return existing;
      const request = Promise.resolve()
        .then(() => fetcher(query))
        .then((data) => {
          // An invalidated request must not repopulate the cache.
          if (pending.get(query) === request) {
            entries.delete(query);
            entries.set(query, { data, expires: now() + ttl });
            if (entries.size > limit) entries.delete(entries.keys().next().value!);
          }
          return data;
        })
        .finally(() => {
          if (pending.get(query) === request) pending.delete(query);
        });
      pending.set(query, request);
      return request;
    },
    clear() {
      entries.clear();
      pending.clear();
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
