"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  children: React.ReactNode;
};

/**
 * Soft radial “light leak” inside a single block (hero). Pointer position is
 * relative to this container only; no global cursor overlay.
 */
export function HeroCursorLeak({ className, children }: Props) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => setFinePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { damping: 38, stiffness: 140, mass: 0.55 };
  const sx = useSpring(mx, spring);
  const sy = useSpring(my, spring);

  const enabled = finePointer && !reduce;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!enabled) return;
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {enabled && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          initial={false}
          animate={{ opacity: hover ? 1 : 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute rounded-full mix-blend-soft-light dark:mix-blend-screen"
            style={{
              width: 560,
              height: 560,
              left: sx,
              top: sy,
              marginLeft: -280,
              marginTop: -280,
              background:
                "radial-gradient(circle closest-side, rgba(255,255,255,0.55) 0%, rgba(125, 211, 252, 0.22) 28%, transparent 68%)",
              filter: "blur(56px)",
              opacity: 0.85,
            }}
          />
          <motion.div
            className="absolute rounded-full mix-blend-overlay dark:mix-blend-soft-light"
            style={{
              width: 320,
              height: 320,
              left: sx,
              top: sy,
              marginLeft: -160,
              marginTop: -160,
              background:
                "radial-gradient(circle closest-side, var(--rr-accent) 0%, transparent 72%)",
              filter: "blur(40px)",
              opacity: 0.35,
            }}
          />
        </motion.div>
      )}

      {children}
    </div>
  );
}
