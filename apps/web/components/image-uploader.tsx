"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
}

/**
 * Avatar/logo uploader: shows the current image (or initials), and on file
 * pick uploads via the storage adapter, surfacing a spinner while in flight.
 * Returns the stored URL through onChange.
 */
export function ImageUploader({
  value,
  onChange,
  name = "",
  shape = "circle",
  size = 96,
  purpose = "avatars",
}: {
  value: string | null;
  onChange: (url: string) => void;
  name?: string;
  shape?: "circle" | "square";
  size?: number;
  purpose?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const rounded = shape === "circle" ? "rounded-full" : "rounded-2xl";

  async function pick(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setBusy(true);
    try {
      const { url } = await api.uploadFile(file, purpose);
      onChange(url);
    } catch (e) {
      toast.error("Upload failed", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        style={{ width: size, height: size }}
        className={`group relative grid shrink-0 place-items-center overflow-hidden ${rounded} bg-brand-100 text-xl font-bold text-brand-700 ring-1 ring-line`}
        aria-label="Change image"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>{initials(name)}</span>
        )}
        <span className={`absolute inset-0 grid place-items-center bg-ink/40 text-white transition-opacity ${busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        </span>
      </button>
      <div className="text-sm">
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="font-medium text-brand-700 hover:text-brand-800 disabled:opacity-50">
          {busy ? "Uploading…" : value ? "Change photo" : "Upload photo"}
        </button>
        <p className="text-xs text-ink-muted">JPG or PNG, up to 5MB.</p>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }}
      />
    </div>
  );
}
