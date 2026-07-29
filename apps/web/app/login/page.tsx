"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { Button, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+2348010000001");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.requestOtp(phone);
      setDevCode(res.devCode ?? null); // dev/mock only
      setStep("code");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyOtp(phone, code);
      saveSession(res.token, res.user.id);
      router.push("/worker");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-extrabold text-brand-700">Sign in to Tally</h1>
      <p className="mb-6 text-neutral-600">
        We&apos;ll text you a 4-digit code. No password needed.
      </p>

      <Card>
        {step === "phone" ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-neutral-700">
              Phone number
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234..."
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2.5 outline-none focus:border-brand-500"
              />
            </label>
            <Button type="button" onClick={sendCode} disabled={loading}>
              {loading ? "Sending…" : "Send code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {devCode && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Dev mode: your code is <strong>{devCode}</strong>
              </p>
            )}
            <label className="block text-sm font-medium text-neutral-700">
              Enter the 4-digit code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={4}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2.5 tracking-[0.5em] outline-none focus:border-brand-500"
              />
            </label>
            <div className="flex gap-2">
              <Button type="button" onClick={verify} disabled={loading}>
                {loading ? "Verifying…" : "Verify & continue"}
              </Button>
              <Button variant="ghost" onClick={() => setStep("phone")}>
                Back
              </Button>
            </div>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </Card>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Seeded demo worker: <code>+2348010000001</code>
      </p>
    </main>
  );
}
