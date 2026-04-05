import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Admin — session cookie + database (no JWT in the browser).
        </p>
        <div className="mt-10">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
