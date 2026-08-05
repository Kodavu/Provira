"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Subtle enter transition on route change: content fades and lifts a few pixels.
 * Keyed on the pathname so it re-runs per navigation. Respects reduced-motion
 * via framer-motion's global setting.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
