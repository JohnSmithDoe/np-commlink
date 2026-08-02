/* ─── why ─────────────────────────────────────────────────────────
 * Both halves of `i18n-key-ownership` derive from this one map, so adding
 * a domain is one line.
 *
 * `tracking` is the one entry carrying a second prefix, deliberately: it
 * publishes inbox rows, and the notifications port takes marker keys
 * rather than copy — including the CTA's label — so the producer names
 * keys in the inbox's namespace by design. The reverse exception is gone;
 * the inbox no longer matches `tracking.*` command tokens to pick a label
 * (CR-055).
 *
 * `@shared` owns no vocabulary at all, which is a different verdict from
 * "no gate applies". Ownership is undefined outside `src/app/<folder>/`
 * and for any folder absent from the map, which is what keeps
 * `app.component.ts` and `app.routes.ts` ungated exactly as the per-folder
 * config blocks this replaced left them.
 * ───────────────────────────────────────────────────────────────── */

export const I18N_OWNERS: Record<string, string[]> = {
  barcode: ['barcode'],
  cash: ['cash'],
  commlink: ['commlink', 'deck'],
  geist: ['geist'],
  household: ['household'],
  notifications: ['notifications'],
  'office-time': ['office-time'],
  settings: ['settings'],
  tasks: ['tasks'],
  tracking: ['tracking', 'notifications'],
  trackplay: ['trackplay'],
};

export const ALL_DOMAIN_PREFIXES: string[] = [
  ...new Set(Object.values(I18N_OWNERS).flat()),
].toSorted();

const domainFolder = (filename: string): string | undefined =>
  /(?:^|[/\\])src[/\\]app[/\\]([^/\\]+)[/\\]/.exec(
    filename.replaceAll('\\', '/')
  )?.[1];

export interface KeyOwnership {
  kind: 'shared' | 'domain';
  owned: string[];
}

export const keyOwnershipFor = (filename: string): KeyOwnership | undefined => {
  const folder = domainFolder(filename);
  if (folder === undefined) return undefined;
  if (folder === '@shared') return { kind: 'shared', owned: [] };
  const owned = I18N_OWNERS[folder];
  return owned ? { kind: 'domain', owned } : undefined;
};
