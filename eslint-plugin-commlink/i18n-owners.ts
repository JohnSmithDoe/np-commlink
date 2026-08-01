// Which i18n namespace each domain folder owns. Both halves of
// `i18n-key-ownership` are derived from this map, so adding a domain means
// adding one line here.
//
// `tracking` is the one entry carrying a second prefix, and deliberately so: it
// publishes inbox rows, and the notifications port takes marker keys rather than
// copy — including the CTA's label — so the producer names keys in the inbox's
// namespace by design. The reverse exception is gone: the inbox no longer matches
// `tracking.*` command tokens to pick a label (CR-055).
export const I18N_OWNERS: Record<string, string[]> = {
  barcode: ['barcode'],
  cash: ['cash'],
  commlink: ['commlink', 'deck'],
  geist: ['geist'],
  groceries: ['grocery'],
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

/** The folder directly under `src/app/`, or undefined outside it. */
const domainFolder = (filename: string): string | undefined =>
  /(?:^|[/\\])src[/\\]app[/\\]([^/\\]+)[/\\]/.exec(
    filename.replaceAll('\\', '/')
  )?.[1];

export interface KeyOwnership {
  /** '@shared' owns no vocabulary at all; a domain owns its own prefixes. */
  kind: 'shared' | 'domain';
  owned: string[];
}

/** Undefined where no gate applies — `app.component.ts`, `app.routes.ts` and
 * any folder absent from the map, exactly as the per-folder config blocks this
 * replaced left them ungated. */
export const keyOwnershipFor = (filename: string): KeyOwnership | undefined => {
  const folder = domainFolder(filename);
  if (folder === undefined) return undefined;
  if (folder === '@shared') return { kind: 'shared', owned: [] };
  const owned = I18N_OWNERS[folder];
  return owned ? { kind: 'domain', owned } : undefined;
};
