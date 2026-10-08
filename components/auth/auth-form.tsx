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
