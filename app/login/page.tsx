import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getSession, isRegistrationOpen } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect(session.user.isAdmin ? "/admin" : "/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";
  const registrationOpen = await isRegistrationOpen();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Sign in
        </h1>
        <div className="mt-10">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        {registrationOpen ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            First-time setup?{" "}
            <Link
              href="/register"
              className="text-foreground underline underline-offset-4"
            >
              Create the initial admin account
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
