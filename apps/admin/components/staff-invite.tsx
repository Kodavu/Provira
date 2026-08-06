"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "./ui";

export function InviteStaff({ roles }: { roles: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [roleIds, setRoleIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const input = "w-full rounded-lg border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, email, department, roleIds: [...roleIds] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not invite");
      setResult({ email: data.email, tempPassword: data.tempPassword });
      setFullName(""); setEmail(""); setDepartment(""); setRoleIds(new Set());
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open)
    return <Button onClick={() => { setOpen(true); setResult(null); setError(null); }}>Invite staff</Button>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close invite modal"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <Card className="relative z-10 w-full max-w-2xl overflow-hidden p-0">
        <div className="flex items-start justify-between gap-4 border-b border-app px-5 py-4">
          <div>
            <p className="eyebrow mb-1">Team access</p>
            <h3 className="text-lg font-semibold">Invite a staff member</h3>
            <p className="mt-1 text-sm text-muted">Create an account, assign roles, and generate a one-time password.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
          <div className="space-y-4 px-5 py-5">
            {result ? (
              <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4">
                <p className="font-semibold">Invited {result.email}</p>
                <p className="mt-1 text-sm text-soft">Share this one-time password securely. In production it&apos;s emailed automatically.</p>
                <p className="mt-3 rounded-xl bg-app px-3 py-2 font-mono text-sm">{result.tempPassword}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Done</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setResult(null); setError(null); }}>Invite another</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} />
                  <input placeholder="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
                </div>
                <input placeholder="Department (e.g. Finance)" value={department} onChange={(e) => setDepartment(e.target.value)} className={input} />
                <div>
                  <p className="eyebrow mb-1.5">Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => {
                      const on = roleIds.has(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRoleIds((s) => {
                            const n = new Set(s);
                            on ? n.delete(r.id) : n.add(r.id);
                            return n;
                          })}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${on ? "bg-brand-600 text-white shadow-sm" : "border border-app text-soft hover:bg-app"}`}
                        >
                          {r.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={submit} disabled={busy || !fullName || !email}>{busy ? "Inviting…" : "Send invite"}</Button>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-app bg-slate-50/70 px-5 py-5 lg:border-l lg:border-t-0 dark:bg-white/[0.03]">
            <p className="eyebrow mb-3">What happens next</p>
            <ul className="space-y-3 text-sm text-soft">
              <li>• A staff profile is created immediately.</li>
              <li>• Selected roles determine their dashboard access.</li>
              <li>• The temporary password is shown once after invite.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
