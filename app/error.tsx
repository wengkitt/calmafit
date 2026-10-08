"use client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-5 p-6">
      <Alert variant="destructive">
        <AlertTitle>Couldn’t load this page</AlertTitle>
        <AlertDescription>Your data is still safe. Please try again in a moment.</AlertDescription>
      </Alert>
      <Button onClick={reset}>Try again</Button>
      <Button variant="outline" nativeButton={false} render={<a href="/dashboard" />}>
        Back to diary
      </Button>
    </main>
  );
}
