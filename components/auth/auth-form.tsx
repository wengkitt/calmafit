"use client";

import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ initialError }: { initialError?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError ?? "");

  async function signInWithGoogle() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/sign-in?error=oauth",
      });
      if (result.error) {
        setError("Google sign-in is unavailable. Please try again.");
        setPending(false);
      }
    } catch {
      setError("Unable to connect to Google. Please try again.");
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>Sign in to CalmaFit</h1>
        </CardTitle>
        <CardDescription>Use your Google account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full"
          disabled={pending}
          onClick={signInWithGoogle}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-icon="inline-start">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.73-.06-1.42-.19-2.09H12v3.96h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.75 3.28-7.95Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.87 0-5.3-1.94-6.17-4.55H2.15v2.84A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.83 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.15a11 11 0 0 0 0 9.86l3.68-2.84Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.58 10.58 0 0 0 12 1a11 11 0 0 0-9.85 6.07l3.68 2.84C6.7 7.32 9.13 5.38 12 5.38Z"
            />
          </svg>
          {pending ? "Connecting to Google…" : "Continue with Google"}
        </Button>
      </CardContent>
    </Card>
  );
}
