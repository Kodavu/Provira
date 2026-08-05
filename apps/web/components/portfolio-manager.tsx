"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, ImageIcon, Loader2, Plus, Trash2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { api, type PortfolioItem } from "@/lib/api";
import { Button, Card } from "@/components/ui";

type Kind = "IMAGE" | "PDF" | "VIDEO" | "LINK";
const KIND_ICON = { IMAGE: ImageIcon, PDF: FileText, VIDEO: Video, LINK: ExternalLink } as const;
const KINDS: { value: Kind; label: string }[] = [
  { value: "IMAGE", label: "Image" },
  { value: "PDF", label: "PDF" },
  { value: "VIDEO", label: "Video" },
  { value: "LINK", label: "Link" },
];

const fieldCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function PortfolioManager({ userId }: { userId: string }) {
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await api.portfolio(userId));
    } catch {
      setItems([]);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? prev);
    try {
      setItems(await api.deletePortfolio(userId, id));
    } catch {
      toast.error("Couldn't remove item");
      load();
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">Portfolio</p>
          <p className="text-sm text-ink-soft">Show your work — photos, documents, videos or links.</p>
        </div>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Add</Button>
        )}
      </div>

      {adding && <AddForm userId={userId} onDone={(next) => { setItems(next); setAdding(false); }} onCancel={() => setAdding(false)} />}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items === null ? (
          <>
            <span className="h-20 animate-pulse rounded-xl bg-line/60" />
            <span className="h-20 animate-pulse rounded-xl bg-line/60" />
          </>
        ) : items.length === 0 ? (
          !adding && <p className="text-sm text-ink-muted">No items yet.</p>
        ) : (
          items.map((p) => {
            const Icon = KIND_ICON[p.kind] ?? ExternalLink;
            return (
              <div key={p.id} className="group relative flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
                <a href={p.url} target="_blank" rel="noreferrer" className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-canvas text-ink-soft">
                  {p.thumbnailUrl || p.kind === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnailUrl || p.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </a>
                <div className="min-w-0 flex-1">
                  <a href={p.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-ink hover:text-brand-700">{p.title}</a>
                  {p.description && <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{p.description}</p>}
                </div>
                <button onClick={() => remove(p.id)} aria-label="Remove" className="rounded-lg p-1 text-ink-muted transition hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function AddForm({ userId, onDone, onCancel }: { userId: string; onDone: (items: PortfolioItem[]) => void; onCancel: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>("IMAGE");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isUpload = kind === "IMAGE" || kind === "PDF";

  async function upload(file: File) {
    setUploading(true);
    try {
      const res = await api.uploadFile(file, "portfolio");
      setUrl(res.url);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (e) {
      toast.error("Upload failed", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!title.trim()) return toast.error("Add a title.");
    if (!url.trim()) return toast.error(isUpload ? "Upload a file first." : "Paste a URL.");
    setSaving(true);
    try {
      const next = await api.addPortfolio(userId, {
        kind, title: title.trim(), url: url.trim(), description: description.trim() || undefined,
        thumbnailUrl: kind === "IMAGE" ? url.trim() : undefined,
      });
      toast.success("Added to portfolio");
      onDone(next);
    } catch (e) {
      toast.error("Couldn't add", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-line bg-canvas/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button key={k.value} type="button" onClick={() => { setKind(k.value); setUrl(""); }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${kind === k.value ? "bg-brand-600 text-white" : "border border-line bg-surface text-ink-soft hover:bg-canvas"}`}>
              {k.label}
            </button>
          ))}
        </div>
        <button onClick={onCancel} aria-label="Cancel" className="rounded-lg p-1 text-ink-muted hover:bg-canvas"><X className="h-4 w-4" /></button>
      </div>

      <input className={fieldCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" maxLength={80} />

      {isUpload ? (
        <div>
          <input ref={fileRef} type="file" accept={kind === "IMAGE" ? "image/*" : "application/pdf"} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface py-3 text-sm font-medium text-ink-soft transition hover:border-brand-300 disabled:opacity-60">
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : url ? "File ready — change" : `Upload ${kind === "IMAGE" ? "image" : "PDF"}`}
          </button>
        </div>
      ) : (
        <input className={fieldCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
      )}

      <input className={fieldCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" maxLength={200} />

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={save} loading={saving} disabled={uploading}>Add item</Button>
      </div>
    </div>
  );
}
