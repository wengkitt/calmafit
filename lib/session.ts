import "server-only";

import { cache } from "react";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";

export const getSession = cache(async () => {
  const requestHeaders = await headers();
  // A missing cookie is anonymous; existing cookies still need full validation.
  if (!getSessionCookie(requestHeaders)) return null;
  return getAuth().api.getSession({ headers: requestHeaders });
});

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}
