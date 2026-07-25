import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { VERSION } from './migrations';

// Key holding the persisted schema version; a mismatch triggers a one-time wipe.
const SCHEMA_VERSION_KEY = 'npc-schema-version';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  readonly #storageService = inject(Storage);

  // Init-once guard. Every storage entry point — `bootstrap()` at boot and
  // per-module `load()`/`loadPrefixed()`/`save()` on route entry — needs the
  // backend, but Storage.create() builds a fresh LocalForage instance on every
  // call. Memoize it so the backend is initialized exactly once regardless of
  // which caller wins the race. (Idempotent-initialization pattern.)
  #ready?: Promise<void>;
  #ensureStorage(): Promise<void> {
    return (this.#ready ??= this.#storageService
      .create()
      .then(() => this.#ensureSchemaVersion()));
  }

  // One-time fresh-baseline reset (category {id,name} epic, migrations §VERSION):
  // if the persisted schema version differs from VERSION, clear the store and
  // re-stamp it. Runs INSIDE the init-once guard so every entry point
  // (bootstrap/load/loadPrefixed/save) sees the reset before its first
  // read/write, and it can only fire once per version bump. On a genuine fresh
  // install the clear is a no-op over an empty store.
  async #ensureSchemaVersion(): Promise<void> {
    const stored = await this.#storageService.get(SCHEMA_VERSION_KEY);
    if (stored === VERSION) return;
    await this.#storageService.clear();
    await this.#storageService.set(SCHEMA_VERSION_KEY, VERSION);
  }

  /**
   * Initialize the storage backend (and run the one-time schema-version reset)
   * without reading anything. The boot path calls this before its first read so
   * the cost is paid once, up front, rather than on whichever lazy module races
   * in first. Idempotent — every other entry point awaits the same guard.
   *
   * Migrations no longer run here — the framework is kept but empty (VERSION
   * '1', §6); when steps return they run on raw keys here, before any lazy
   * module loads.
   */
  async bootstrap(): Promise<void> {
    await this.#ensureStorage();
  }

  /**
   * Per-key read for a module's own lazy load effect (lazy-modules plan §5).
   * Awaits the init-once storage guard so a caller firing before boot init
   * (e.g. a module load dispatched at registration) never hits an uncreated
   * backend. Returns null when the key is absent → the reducer's `loaded`
   * handler falls back to its initialState.
   */
  async load<T>(key: string): Promise<T | null> {
    await this.#ensureStorage();
    return this.#storageService.get('npc-' + key);
  }

  /**
   * Read every doc whose key starts with `npc-<prefix>`, in one pass over the
   * store. The generic counterpart to `load()` for a caller that owns a whole
   * *family* of keys rather than one slice — the dashboard's per-source
   * `summary-<source>` docs are the only such family today.
   *
   * Deliberately prefix-keyed rather than dashboard-shaped: the port must not
   * know any domain's document type (ports & adapters). The caller supplies T.
   */
  async loadPrefixed<T>(prefix: string): Promise<T[]> {
    await this.#ensureStorage();
    const docs: T[] = [];
    // eslint-disable-next-line unicorn/no-array-for-each -- Storage.forEach (@ionic/storage), not Array#forEach
    await this.#storageService.forEach((value: T, key: string) => {
      if (key.startsWith('npc-' + prefix)) docs.push(value);
    });
    return docs;
  }

  // Per-key persistence port. Keyed by a plain string (not `keyof IDatastore`)
  // so the kernel doesn't have to enumerate every context's slice type — each
  // bounded context owns its own key + shape and calls save<TItsOwnSlice>(...).
  //
  // Awaits the init-once guard like every other entry point. A lazy module's
  // save effect only ever fires after route entry, by which time boot has
  // created the backend — so this was safe by *ordering*, not by construction.
  // Ionic Storage.set() throws synchronously on an uncreated backend, so any
  // future caller that writes before boot completes would have hit that; the
  // guard is memoized, so on the warm path this costs one resolved-promise tick.
  async save<T>(key: string, value: T | null | undefined) {
    await this.#ensureStorage();
    return await this.#storageService.set('npc-' + key, value);
  }
}
