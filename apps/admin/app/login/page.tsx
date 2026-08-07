"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Card } from "@/components/ui";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password is too short"),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "superadmin@truvo.com.ng", password: "admin1234" },
  });

  async function onSubmit(values: Form) {
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      setError("Invalid email or password");
      return;
    }
    router.push("/");
    router.refresh();
  }

  const input =
    "w-full rounded-lg border border-app surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-500/20";

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">T</span>
          <span className="text-xl font-bold tracking-tight">Truvo Admin</span>
        </div>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mb-6 mt-1 text-sm text-soft">Back-office access for Truvo staff.</p>

        <Card className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <label className="block text-sm font-medium text-soft">
              Work email
              <input type="email" {...register("email")} className={`mt-1.5 ${input}`} />
              {formState.errors.email && <span className="mt-1 block text-xs text-red-600">{formState.errors.email.message}</span>}
            </label>
            <label className="block text-sm font-medium text-soft">
              Password
              <input type="password" {...register("password")} className={`mt-1.5 ${input}`} />
              {formState.errors.password && <span className="mt-1 block text-xs text-red-600">{formState.errors.password.message}</span>}
            </label>
            <Button type="submit" disabled={formState.isSubmitting} className="w-full">
              {formState.isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </Card>

        <div className="mt-5 rounded-lg border border-app surface p-3 text-xs text-muted">
          <p className="font-medium text-soft">Demo accounts</p>
          <p className="mt-1">Super Admin — superadmin@truvo.com.ng / admin1234</p>
          <p>Support — support@truvo.com.ng / support1234</p>
        </div>
      </div>
    </main>
  );
}
