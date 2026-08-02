/* ─── why ─────────────────────────────────────────────────────────
 * Without this request the whole datastore lives in a best-effort bucket the
 * browser may evict under disk pressure — silently, and with no backend to
 * restore it from. Fire-and-forget on purpose: Firefox answers with a
 * permission prompt, and awaiting it would hold app init open for as long as
 * the user thinks. The optional chaining is load-bearing despite the DOM types
 * calling `navigator.storage` non-optional — it is genuinely absent on a
 * non-secure origin and in jsdom.
 * ───────────────────────────────────────────────────────────────── */
import { EnvironmentProviders, provideAppInitializer } from '@angular/core';

export const provideDurableStorage = (): EnvironmentProviders =>
  provideAppInitializer(() => {
    void navigator.storage?.persist().catch(() => {});
  });
