"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Reduced-motion strategy (recommended by Motion docs):
 * - development: "never" so animations are visible locally even when the OS
 *   has reduced motion enabled, and the dev-only warning goes away.
 * - production: "user" so we respect each visitor's accessibility preference.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion={process.env.NODE_ENV === "production" ? "user" : "never"}>
      {children}
    </MotionConfig>
  );
}
