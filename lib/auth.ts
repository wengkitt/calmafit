import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";

import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;

  if (!secret || secret.length < 32) {
    throw new Error("Set BETTER_AUTH_SECRET to a random secret of at least 32 characters.");
  }
  if (!baseURL) {
    throw new Error("Set BETTER_AUTH_URL to the application's origin.");
  }

  return betterAuth({
    appName: "Calma",
    secret,
    baseURL,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
      // Neon's HTTP driver does not support interactive transactions.
      transaction: false,
    }),
    emailAndPassword: { enabled: true },
    socialProviders: {
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
    },
    plugins: [nextCookies()],
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

// Defer credential validation until an authentication request is made.
export function getAuth() {
  return (auth ??= createAuth());
}
