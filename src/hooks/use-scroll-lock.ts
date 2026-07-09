"use client";

import * as React from "react";

/**
 * Freeze a scroll container (by id) for as long as this component is mounted,
 * so the blurred `/details` background can't scroll behind a full-screen
 * overlay. Restores the previous overflow on unmount. The companion to the
 * overlays' focus trap: the trap stops Tab escaping, this stops wheel/touch
 * scroll bleeding through.
 */
export function useScrollLock(elementId: string) {
  React.useEffect(() => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const previous = el.style.overflow;
    el.style.overflow = "hidden";
    return () => {
      el.style.overflow = previous;
    };
  }, [elementId]);
}

/** Shared id of the `/details` scroll container that overlays freeze. */
export const DETAILS_SCROLL_ID = "details-scroll";
