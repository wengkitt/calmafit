import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getSession } from "@/lib/session";

export const metadata = { title: "Sign in" };

async function SignInForm({ searchParams }: PageProps<"/sign-in">) {
  const [params, session] = await Promise.all([searchParams, getSession()]);
  if (session) redirect("/dashboard");
  return (
    <AuthForm
      mode="sign-in"
      initialError={
        params.error ? "Google sign-in wasn't completed. Please try again or use email." : undefined
      }
    />
  );
}

export default function SignInPage(props: PageProps<"/sign-in">) {
  return (
    <main className="flex flex-1 items-center justify-center p-4 py-12">
      <Suspense fallback={<p role="status">Loading sign in…</p>}>
        <SignInForm {...props} />
      </Suspense>
    </main>
  );
}
