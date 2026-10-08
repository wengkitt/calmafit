import { Suspense } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Dashboard" };

async function Dashboard() {
  const { user } = await requireSession();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>Dashboard</h1>
        </CardTitle>
        <CardDescription>You’re signed in successfully.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Name</dt>
            <dd className="break-words font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="break-all">{user.email}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter>
        <SignOutButton />
      </CardFooter>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 py-12">
      <Suspense fallback={<p role="status">Loading dashboard…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}
