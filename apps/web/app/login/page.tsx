"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { Button, Card, Input } from "@/components/ui";

const DEMO = [
  { label: "Worker", phone: "+2348010000001" },
  { label: "Trader", phone: "+2348010000002" },
  { label: "Employer", phone: "+2348010000003" },
];

function routeForRoles(roles: string[]): string {
  if (roles.includes("EMPLOYER")) return "/employer";
  if (roles.includes("TRADER")) return "/trader";
  return "/worker";
}

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
      setDevCode(res.devCode ?? null);
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
      const user = await api.getUser(res.user.id);
      router.push(routeForRoles(user.roles.map((r) => r.role)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-sm font-bold text-white">
          T
        </span>
        <span className="font-display text-2xl font-semibold text-ink">Tally.</span>
      </div>
      <h1 className="font-display text-3xl font-semibold text-ink">Sign in</h1>
      <p className="mb-6 mt-1 text-ink-soft">
        We&apos;ll text you a 4-digit code — no password needed.
      </p>

      <Card className="p-5">
        {step === "phone" ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-ink-soft">
              Phone number
              <div className="mt-1.5">
                <Input value={phone} onChange={setPhone} placeholder="+234…" />
              </div>
            </label>
            <Button type="button" onClick={sendCode} disabled={loading} className="w-full">
              {loading ? "Sending…" : "Send code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {devCode && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Dev mode: your code is <strong>{devCode}</strong>
              </p>
            )}
            <label className="block text-sm font-medium text-ink-soft">
              Enter the 4-digit code
              <div className="mt-1.5">
                <Input
                  value={code}
                  onChange={setCode}
                  inputMode="numeric"
                  maxLength={4}
                  className="tracking-[0.5em]"
                />
              </div>
            </label>
            <div className="flex gap-2">
              <Button type="button" onClick={verify} disabled={loading} className="flex-1">
                {loading ? "Verifying…" : "Verify & continue"}
              </Button>
              <Button variant="outline" onClick={() => setStep("phone")}>
                Back
              </Button>
            </div>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </Card>

      <div className="mt-6">
        <p className="eyebrow mb-2">Demo accounts — tap to fill</p>
        <div className="flex flex-wrap gap-2">
          {DEMO.map((d) => (
            <button
              key={d.phone}
              onClick={() => {
                setPhone(d.phone);
                setStep("phone");
                setDevCode(null);
              }}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-canvas"
            >
              {d.label} · {d.phone}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
