"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function AuthForm({
  mode,
  initialError,
}: {
  mode: "sign-in" | "sign-up";
  initialError?: string;
}) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState(initialError ?? "");

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending("email");
    setError("");

    try {
      const credentials = {
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      };
      const result = isSignUp
        ? await authClient.signUp.email({ ...credentials, name: String(form.get("name")).trim() })
        : await authClient.signIn.email(credentials);

      if (result.error) {
        setError(
          isSignUp
            ? "We couldn't create your account. Check your details or sign in if you already have an account."
            : "Unable to sign in. Check your email and password and try again.",
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function signInWithGoogle() {
    if (pending) return;
    setPending("google");
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/sign-in?error=oauth",
      });
      if (result.error) {
        setError("Google sign-in is unavailable. Please try again or use email.");
        setPending(null);
      }
    } catch {
      setError("Unable to connect to Google. Please try again.");
      setPending(null);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>{isSignUp ? "Create an account" : "Sign in to Calma"}</h1>
        </CardTitle>
        <CardDescription>
          {isSignUp ? "Sign up with Google or your email." : "Continue with Google or your email."}
        </CardDescription>
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
          disabled={pending !== null}
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
          {pending === "google" ? "Connecting to Google…" : "Continue with Google"}
        </Button>
        <FieldSeparator>Or continue with email</FieldSeparator>
        <form onSubmit={submitEmail} aria-busy={pending !== null}>
          <FieldGroup>
            {isSignUp ? (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  pattern=".*\S.*"
                  disabled={pending !== null}
                  className="min-h-11"
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={pending !== null}
                className="min-h-11"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={8}
                maxLength={128}
                disabled={pending !== null}
                className="min-h-11"
                aria-describedby={isSignUp ? "password-hint" : undefined}
              />
              {isSignUp ? (
                <FieldDescription id="password-hint">Use at least 8 characters.</FieldDescription>
              ) : null}
            </Field>
            <Button type="submit" className="min-h-11 w-full" disabled={pending !== null}>
              {pending === "email" ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-wrap justify-center gap-1 text-sm text-muted-foreground">
        {isSignUp ? "Already have an account?" : "New to Calma?"}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="inline-flex min-h-11 items-center text-foreground underline underline-offset-4"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </CardFooter>
    </Card>
  );
}
