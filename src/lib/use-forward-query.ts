"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

/**
 * Deep-link / campaign params (e.g. a QR that opens `?lang=english`, plus any
 * `utm_*`) should survive every hop of the flow. This returns a helper that
 * merges the CURRENT URL's query onto a navigation target, so links carry the
 * incoming params forward. A param explicitly set on the target path wins over
 * the inherited one (e.g. the language row's own `lang` beats the URL's).
 *
 * Components using this must sit under a <Suspense> boundary (useSearchParams).
 */
export function useForwardQuery() {
  const searchParams = useSearchParams();
  const current = searchParams.toString();

  return React.useCallback(
    (path: string) => {
      const [base, ownQuery] = path.split("?");
      const merged = new URLSearchParams(current);
      if (ownQuery) {
        // The target's explicit params take precedence over inherited ones.
        new URLSearchParams(ownQuery).forEach((v, k) => merged.set(k, v));
      }
      const qs = merged.toString();
      return qs ? `${base}?${qs}` : base;
    },
    [current],
  );
}
