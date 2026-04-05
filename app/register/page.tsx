import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { getSession } from "@/lib/auth/session";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Create account
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          For development — add email verification before production.
        </p>
        <div className="mt-10">
          <RegisterForm />
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
