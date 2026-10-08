import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getSession } from "@/lib/session";

export const metadata = { title: "Create account" };

async function SignUpForm() {
  if (await getSession()) redirect("/dashboard");
  return <AuthForm mode="sign-up" />;
}

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 py-12">
      <Suspense fallback={<p role="status">Loading sign up…</p>}>
        <SignUpForm />
      </Suspense>
    </main>
  );
}
