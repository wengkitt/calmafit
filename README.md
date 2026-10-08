# Calma

A mobile-first calorie, macronutrient, and body weight tracking app.
The current screens provide a simple authentication flow for testing login.

## Development

```bash
pnpm install
cp .env.example .env.local
# Fill in the database and authentication settings described below.
pnpm db:migrate
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The home route opens `/dashboard`;
visitors without a valid session are redirected to `/sign-in`. Use `/sign-up`
to create an account. The dashboard shows your name and email and a sign-out button.

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

Email/password registration and sign-in are available at `/sign-up` and `/sign-in`.
Google sign-in uses the same screens. Successful authentication opens `/dashboard`,
which validates the session on the server and includes sign-out.

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

Google is enabled only when both OAuth credentials are set. Email/password works
independently. Email verification and password reset delivery are not configured;
they require an email service. Email registration currently signs users in immediately.

Server configuration lives in `lib/auth.ts`; `getAuth()` initializes it on first
use so credentials are not required just to import the route during a build.
The Next.js handler is mounted at `/api/auth/[...all]`. Client Components can use
`authClient` from `lib/auth-client.ts` for `signIn`, `signUp`, `signOut`, and `useSession`.

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
