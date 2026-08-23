/* ─── why ─────────────────────────────────────────────────────────
 * Without this request the whole datastore lives in a best-effort bucket the
 * browser may evict under disk pressure — silently, and with no backend to
 * restore it from. Fire-and-forget on purpose: Firefox answers with a
 * permission prompt, and awaiting it would hold app init open for as long as
 * the user thinks. The optional chaining is load-bearing despite the DOM types
 * calling `navigator.storage` non-optional — it is genuinely absent on a
 * non-secure origin and in jsdom.
 *
 * Which is why the answer is READ back separately rather than remembered from
 * the request: the grant can arrive minutes after init, or be revoked, so the
 * settings row asks the browser at the moment it paints.
 * ───────────────────────────────────────────────────────────────── */
import { EnvironmentProviders, provideAppInitializer } from '@angular/core';

export type StoragePersistence = 'granted' | 'denied' | 'unsupported';

export const provideDurableStorage = (): EnvironmentProviders =>
  provideAppInitializer(() => {
    void navigator.storage?.persist().catch(() => {});
  });

export const readStoragePersistence = async (): Promise<StoragePersistence> => {
  if (!navigator.storage?.persisted) return 'unsupported';
  const persisted = await navigator.storage.persisted().catch(() => null);
  if (persisted === null) return 'unsupported';
  return persisted ? 'granted' : 'denied';
};
