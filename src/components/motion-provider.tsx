"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * The hero bands, marquee and scroll reveals are core to the event's visual
 * identity, so we always play them ("never") — even when the OS has reduced
 * motion enabled. (For a calmer/accessible variant, switch to "user".)
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}
