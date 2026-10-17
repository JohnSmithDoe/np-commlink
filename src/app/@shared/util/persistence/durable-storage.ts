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

export const provideDurableStorage = (): EnvironmentProviders => {
  return provideAppInitializer(() => {
    void globalThis.navigator.storage?.persist().catch(() => {});
  });
};

export const readStoragePersistence = async (): Promise<StoragePersistence> => {
  const { storage } = globalThis.navigator;
  if (!storage?.persisted) return 'unsupported';
  let isPersisted: boolean;
  try {
    isPersisted = await storage.persisted();
  } catch {
    return 'unsupported';
  }
  return isPersisted ? 'granted' : 'denied';
};
