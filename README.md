This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database (Drizzle + Neon PostgreSQL)

The database client uses Drizzle ORM with Neon's HTTP driver. Credentials are
only needed when querying the database or running commands that connect to it.

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to the PostgreSQL connection string from your Neon dashboard,
   including its SSL parameters. Keep `.env.local` out of Git.
3. Define and export your tables in `lib/db/schema.ts` using `drizzle-orm/pg-core`.
4. Generate a migration with `pnpm db:generate`, review the SQL in `drizzle/`,
   then apply it with `pnpm db:migrate`.

No application tables or migrations are included yet. Commit generated migration
files alongside schema changes. Migration generation works without credentials;
migration application requires `DATABASE_URL`.

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

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
