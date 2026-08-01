"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ClipboardEvent } from "react";

// Segmented one-time-code input. Holds its own digit array and syncs to the
// parent via onChange, using functional updates so rapid typing / paste never
// races on stale state. onComplete fires once the last digit lands.
export function OtpInput({
  value,
  onChange,
  length = 4,
  disabled,
  error,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  onComplete?: (v: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(() => padTo(value, length));

  // Keep in sync if the parent resets the value (e.g., on resend).
  useEffect(() => {
    setDigits((prev) => (prev.join("") === value ? prev : padTo(value, length)));
  }, [value, length]);

  function commit(next: string[]) {
    const joined = next.join("");
    onChange(joined);
    if (joined.length === length && !next.includes("")) onComplete?.(joined);
  }

  function setAt(i: number, d: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      commit(next);
      return next;
    });
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = padTo(pasted, length);
    setDigits(next);
    commit(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label={`${length}-digit code`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          onChange={(e) => setAt(i, e.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          className={`h-14 w-full rounded-2xl border bg-surface text-center text-2xl font-semibold text-ink outline-none transition
            focus:ring-4 disabled:opacity-50
            ${error
              ? "border-error/60 focus:border-error focus:ring-error/10"
              : "border-line focus:border-brand-500 focus:ring-brand-100"}`}
        />
      ))}
    </div>
  );
}

function padTo(v: string, length: number): string[] {
  return Array.from({ length }, (_, i) => v[i] ?? "");
}
