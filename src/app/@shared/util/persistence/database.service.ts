import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

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
  #ready?: Promise<unknown>;
  async #ensureStorage(): Promise<void> {
    await (this.#ready ??= this.#storageService.create());
  }

  /**
   * Initialize the storage backend without reading anything. The boot path
   * calls this before its first read so the cost is paid once, up front, rather
   * than on whichever lazy module races in first. Idempotent — every other
   * entry point awaits the same guard.
   *
   * Schema evolution is per-domain now (migrate-on-read, via the load effects +
   * @shared/util/db/versioned) — there is no global boot migration or wipe.
   */
  async bootstrap(): Promise<void> {
    await this.#ensureStorage();
  }

  /**
   * Per-key read for a module's own lazy load effect.
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
   * `summary-<source>` documents are the only such family today.
   *
   * Deliberately prefix-keyed rather than dashboard-shaped: the port must not
   * know any domain's document type (ports & adapters). The caller supplies T.
   */
  async loadPrefixed<T>(prefix: string): Promise<T[]> {
    await this.#ensureStorage();
    // Select the keys first, then read only those. `Storage.forEach` would walk
    // every entry in the database and deserialize each value to decide — which
    // on the eager boot path means inflating `npc-groceries`, `npc-cash` and
    // `npc-trackplay` in full just to find a handful of small summary documents.
    const keys = await this.#storageService.keys();
    const matching = keys.filter((key) => key.startsWith('npc-' + prefix));
    const documents: (T | null)[] = await Promise.all(
      matching.map((key) => this.#storageService.get(key))
    );
    return documents.filter(
      (storedDocument): storedDocument is T => storedDocument !== null
    );
  }

  // Per-key persistence port. Keyed by a plain string (not a slice registry)
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
    const write = this.#write(key, value);
    this.#pendingWrites.add(write);
    try {
      return await write;
    } finally {
      this.#pendingWrites.delete(write);
    }
  }

  /**
   * Resolves once every write issued so far has settled.
   *
   * An *observation* of the one writer, not a second one: a caller that has to
   * know the doc is on disk before it does something irreversible (the language
   * switch reloads the app) would otherwise have to write the key itself and
   * race the save effect for it. Rejections are absorbed — a failed write is
   * already handled where it was issued, and "settled" here means "no longer
   * in flight", not "succeeded".
   */
  async settled(): Promise<void> {
    await Promise.allSettled(this.#pendingWrites);
  }

  readonly #pendingWrites = new Set<Promise<unknown>>();

  async #write<T>(key: string, value: T | null | undefined) {
    await this.#ensureStorage();
    return await this.#storageService.set('npc-' + key, value);
  }
}
