"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(true);
        return;
      }
      router.replace("/sign-in");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Unable to sign out. Please try again.</AlertDescription>
        </Alert>
      ) : null}
      <Button variant="outline" className="min-h-11" onClick={signOut} disabled={pending}>
        {pending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
