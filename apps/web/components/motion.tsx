"use client";

// Small, reusable motion primitives so pages get consistent, tasteful entrance
// and number animations without each one re-inventing them. Everything respects
// prefers-reduced-motion.

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { formatNaira } from "@/components/ui";

const EASE = [0.22, 1, 0.36, 1] as const;

// Container that fades+lifts its children in sequence. Pair with <StaggerItem>.
export function Stagger({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: {},
    show: {
      transition: reduce ? {} : { staggerChildren: 0.06, delayChildren: delay },
    },
  };
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: EASE },
    },
  };
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

// Simple one-shot fade/lift, e.g. for a page header.
export function FadeIn({
  children,
  className = "",
  delay = 0,
  y = 8,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated number that counts up when scrolled into view. `format` controls the
// rendering — defaults to a plain integer; pass a money formatter for currency.
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString("en-NG"),
  className = "",
  duration = 1.1,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}

/** Money count-up in kobo → naira (accepts the string/bigint amounts the API uses). */
export function CountUpNaira({
  amount,
  className = "",
}: {
  amount: string | number;
  className?: string;
}) {
  return (
    <CountUp
      value={Number(amount)}
      format={(n) => formatNaira(String(Math.round(n)))}
      className={className}
    />
  );
}

// Animated radial progress ring. Sweeps from 0 to `pct` on mount.
export function AnimatedRing({
  pct,
  size = 148,
  stroke = 12,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const target = c - (clamped / 100) * c;

  const mv = useMotionValue(reduce ? target : c);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const offset = useTransform(spring, (v) => v);

  useEffect(() => {
    mv.set(target);
  }, [target, mv]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#3d3bf3"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

// Progress bar that grows to `pct` on mount.
export function AnimatedBar({ pct, className = "" }: { pct: number; className?: string }) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-canvas ${className}`}>
      <motion.div
        className="h-full rounded-full bg-brand-600"
        initial={reduce ? { width: `${clamped}%` } : { width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </div>
  );
}

// Subtle press feedback for tappable cards.
export function Pressable({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div whileTap={{ scale: 0.99 }} className={className} onClick={onClick}>
      {children}
    </motion.div>
  );
}
