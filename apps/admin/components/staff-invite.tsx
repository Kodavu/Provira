"use client";

import { useState } from "react";
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
    return <Button onClick={() => { setOpen(true); setResult(null); }}>Invite staff</Button>;

  return (
    <Card className="w-full max-w-xl p-5">
      {result ? (
        <div>
          <p className="font-semibold">Invited {result.email}</p>
          <p className="mt-1 text-sm text-soft">Share this one-time password securely (in production it&apos;s emailed):</p>
          <p className="mt-2 rounded-lg bg-app px-3 py-2 font-mono text-sm">{result.tempPassword}</p>
          <div className="mt-3"><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Done</Button></div>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold">Invite a staff member</h3>
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
                    onClick={() => setRoleIds((s) => { const n = new Set(s); on ? n.delete(r.id) : n.add(r.id); return n; })}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${on ? "bg-brand-600 text-white" : "border border-app text-soft hover:bg-app"}`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={busy || !fullName || !email}>{busy ? "Inviting…" : "Send invite"}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
