"use client";
import { useEffect, useState } from "react";
import { initializeTimezone } from "@/lib/tracking/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export function InitializeTimezone({ needed }: { needed: boolean }) {
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!needed) return;
    let live = true;
    initializeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      .then((result) => {
        if (live) setError(!result.ok);
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [needed]);
  if (!error) return null;
  return (
    <Alert>
      <AlertDescription>
        We couldn’t set your timezone. Dates currently use UTC.{" "}
        <Button variant="link" nativeButton={false} render={<a href="/settings" />}>
          Set timezone
        </Button>
      </AlertDescription>
    </Alert>
  );
}
