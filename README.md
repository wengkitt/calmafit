# CalmaFit

A mobile-first calorie, macronutrient, and body weight tracking app.
Track daily meals, calories and macros, contribute to a shared versioned food bank, and record weight and personal goals.

## Development

```bash
pnpm install
cp .env.example .env.local
# Fill in the database and authentication settings described below.
pnpm db:migrate
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The home route opens `/dashboard`;
visitors without a valid session are redirected to `/sign-in` to continue with Google. The dashboard opens your food diary. Food bank, weight history, and settings are available from the mobile bottom navigation or desktop sidebar.

Run `pnpm lint` and `pnpm exec tsc --noEmit` to check the project.

## Database (Drizzle + Neon PostgreSQL)

The database client uses Drizzle ORM with Neon's HTTP driver. Credentials are
only needed when querying the database or running commands that connect to it.

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to the PostgreSQL connection string from your Neon dashboard,
   including its SSL parameters. Keep `.env.local` out of Git.
3. Define and export your tables in `lib/db/schema.ts` using `drizzle-orm/pg-core`.
4. Generate a migration with `pnpm db:generate`, review the SQL in `drizzle/`,
   then apply it with `pnpm db:migrate`.

The Better Auth tables and their initial migration are included. Commit generated
migration files alongside schema changes. Migration generation works without
credentials; migration application requires `DATABASE_URL`.

| Command            | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| `pnpm db:generate` | Generate SQL migrations from schema changes               |
| `pnpm db:migrate`  | Apply pending migrations to the configured database       |
| `pnpm db:push`     | Apply schema changes directly for development prototyping |
| `pnpm db:studio`   | Open Drizzle Studio to browse the configured database     |

Use the client from Server Components, Server Actions, or Route Handlers:

```ts
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

const result = await getDb().execute(sql`select 1 as connected`);
```

The client is marked `server-only` and initialized on first use. Never use a
`NEXT_PUBLIC_` prefix for database credentials. Drizzle Kit loads `.env*` files
with `@next/env`, following Next.js environment loading rules.

The HTTP driver suits ordinary queries and batched transactions. Interactive
transactions requiring a persistent session need Neon's WebSocket driver instead.
See the [Drizzle Neon guide](https://orm.drizzle.team/docs/get-started/neon-new).

## Authentication (Better Auth)

Google is the only sign-in method, available at `/sign-in`. First-time Google users
receive an account automatically. Email/password sign-in and registration are disabled,
and `/sign-up` redirects to `/sign-in`. Successful authentication opens `/dashboard`,
which validates the session on the server. Sign-out is available in the desktop sidebar
and in Settings on mobile.

Before using authentication:

1. Set `DATABASE_URL` in `.env.local`.
2. Generate a secret with `openssl rand -base64 32` and set `BETTER_AUTH_SECRET`.
3. Set `BETTER_AUTH_URL` to `http://localhost:3000` locally, or your HTTPS origin
   in production. Use a stable secret for each deployed environment.
4. Run `pnpm db:migrate` to create the user, session, account, and verification
   tables. This changes the database configured by `DATABASE_URL`.
5. For Google, create an OAuth client of type **Web application** in
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   Configure your consent screen and add test users if the app is in testing mode.
   Set the authorized JavaScript origin to `http://localhost:3000` and the redirect
   URI to `http://localhost:3000/api/auth/callback/google`. Add equivalent entries
   for your production origin. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
6. Restart the development server after changing environment variables.

Google requires both OAuth credentials to be set. Existing user records are preserved.

Server configuration lives in `lib/auth.ts`; `getAuth()` initializes it on first
use so credentials are not required just to import the route during a build.
The Next.js handler is mounted at `/api/auth/[...all]`. Client Components can use
`authClient` from `lib/auth-client.ts` for Google `signIn.social`, `signOut`, and `useSession`.

Protect each page, Route Handler, or Server Action that accesses private data by
validating its session on the server. Do not rely only on a layout or cookie presence:

```ts
import { requireSession } from "@/lib/session";

const { user } = await requireSession();
// Scope private database reads and writes to user.id.
```

Use `getSession()` for optional authentication or API responses that should return
401 instead of redirecting. With Cache Components enabled, runtime session reads
in pages belong inside a Suspense boundary, as shown in `app/dashboard/page.tsx`.
The Drizzle adapter uses sequential operations because Neon's HTTP driver does
not support interactive transactions.

See [Better Auth's Next.js integration](https://better-auth.com/docs/integrations/next)
and [Google setup](https://better-auth.com/docs/authentication/google).

## Tracking

- `/dashboard`: daily diary grouped into breakfast, lunch, dinner, and snacks. Choose a date, search foods, pick a nutrition version, or enter private nutrition manually. Recent foods include your private entries.
- `/foods`: shared, searchable food bank. Search results contain food summaries and version counts; nutrition versions load when a food is selected. Versions are immutable. Contributions append a version rather than changing old information. The bank starts empty.
- `/weight`: one editable kilogram measurement per date, with 30 check-ins per page and a chart covering the last 30, 90, or 365 days. Older check-ins remain accessible through history navigation. Summary cards always use the latest and first lifetime measurements. Missing measurement days appear as gaps.
- `/settings`: optional calorie, macro, and weight goals, timezone, and sign-out. Goals apply to all dates. The browser timezone is initialized on the first diary or weight visit.

Nutrition can be entered per 100 g or per named serving. Gram/serving conversion requires a known serving weight. Diary entries keep the original nutrition snapshot and calculate using unrounded values, so later versions cannot change past totals. Publishing a manual entry and logging it use one database transaction. Private data access is authenticated and scoped to the current user; shared food contributions require sign-in.

Apply the generated tracking migration with `pnpm db:migrate` before using these screens. Migration application changes the database configured by `DATABASE_URL`.

## Verification

```bash
pnpm test                    # Pure nutrition, date, timezone, and validation tests
pnpm test:db                 # Database smoke checks; requires migrated DATABASE_URL
pnpm test:app                # Authenticated HTTP smoke checks; requires pnpm dev and the same database
pnpm test:performance        # Production HTTP timings and payload regressions; defaults to localhost:3100
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

The database smoke check inserts unique fixtures and removes them within the same atomic batch. It checks snapshot stability, user-scoped query behavior, multiple food versions, duplicate entry protection, and weight upserts. It does not replace browser testing of authentication and Server Actions.

If the package runner prevents Turbopack from starting its local CSS worker, run `node node_modules/next/dist/bin/next build` directly with the same environment.

The local app smoke check creates two temporary accounts and verifies rendered diary/weight isolation, shared food visibility, and anonymous redirects. It cleans its own accounts and fixtures in a `finally` block. Use the same database for the local server and smoke check.

For the performance check, build the app and run `node node_modules/next/dist/bin/next start -p 3100` in another terminal. The check creates a temporary account with 400 weight measurements and a shared food with 100 nutrition versions, measures three warm responses per route, and verifies bounded history, pagination, lifetime summaries, and summary-only food payloads. Fixtures are removed afterward. Set `TEST_APP_URL` to use another local port. Pass `--measure-only` when collecting a baseline before an optimization. Timings are diagnostic, not pass/fail thresholds; they do not measure browser interaction or Core Web Vitals.
