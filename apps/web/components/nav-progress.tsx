"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Slim top progress bar that gives instant feedback the moment an internal link
 * is clicked, bridging the gap while the next page loads. Starts on link click,
 * trickles forward, completes when the route changes. Same behaviour as the
 * admin app's bar, in the brand blue.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const running = useRef(false);

  function stopTrickle() {
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
  }

  function begin() {
    if (running.current) return;
    running.current = true;
    setActive(true);
    setWidth(8);
    stopTrickle();
    trickle.current = setInterval(() => {
      setWidth((w) => (w >= 90 ? 90 : w + Math.max(0.5, (90 - w) * 0.1)));
    }, 180);
  }

  useEffect(() => {
    if (!running.current) return;
    stopTrickle();
    setWidth(100);
    const done = setTimeout(() => {
      setActive(false);
      setWidth(0);
      running.current = false;
    }, 280);
    return () => clearTimeout(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      let dest: URL;
      try {
        dest = new URL(anchor.href);
      } catch {
        return;
      }
      if (dest.pathname === pathname) return;
      begin();
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      stopTrickle();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className="h-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500 shadow-[0_0_12px_1px] shadow-brand-500/50 transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${width}%`, opacity: active ? 1 : 0 }}
      />
    </div>
  );
}
