/**
 * Wizard state shared across the campaign steps, so going back to a previous
 * screen shows the user's last choices/inputs.
 *
 *  - story / lang / name / phone → sessionStorage (survive reloads + back-nav)
 *  - the selfie File → a module variable (a File can't cheaply serialize to
 *    sessionStorage). It survives client-side navigation because the module
 *    isn't reloaded, but is cleared on a full page reload.
 */
import type { SelfieMeta } from "@/lib/selfie-check";

export type WizardData = {
  story?: string;
  lang?: string;
  name?: string;
  phone?: string;
};

const KEY = "hero_wizard";

export function getWizard(): WizardData {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) || "{}") as WizardData;
  } catch {
    return {};
  }
}

export function patchWizard(patch: Partial<WizardData>): void {
  if (typeof window === "undefined") return;
  const next = { ...getWizard(), ...patch };
  window.sessionStorage.setItem(KEY, JSON.stringify(next));
}

// ── Selfie (in-memory; survives client nav, not a full reload) ──────────────
export type StoredSelfie = { file: File; meta: SelfieMeta | null };

let selfieMem: StoredSelfie | null = null;

export function getStoredSelfie(): StoredSelfie | null {
  return selfieMem;
}

export function setStoredSelfie(selfie: StoredSelfie | null): void {
  selfieMem = selfie;
}
