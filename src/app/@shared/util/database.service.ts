import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { IDashboardSummary } from '../types';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  readonly #storageService = inject(Storage);

  // Init-once guard. Every storage entry point — `bootstrap()` (dashboard
  // read-model) at boot, per-module `load()`/`save()` on route entry, and
  // `saveSummary()` from the telemetry reporters — needs the backend, but
  // Storage.create() builds a fresh LocalForage instance on every call. Memoize
  // it so the backend is initialized exactly once regardless of which caller
  // wins the race. (Idempotent-initialization pattern.)
  #ready?: Promise<void>;
  #ensureStorage(): Promise<void> {
    return (this.#ready ??= this.#storageService
      .create()
      .then(() => undefined));
  }

  /**
   * Boot path for the persisted dashboard read-model (lazy-modules plan §3):
   * ensure the storage backend, then read every `npc-summary-*` doc so the deck
   * can render cold-launch numbers before any producing module is loaded. This
   * is the single eager storage read at boot (the whole-datastore `create()`
   * was retired in Phase C). Migrations no longer run here — the framework is
   * kept but empty (VERSION '1', §6); when steps return they run on raw keys
   * here, before any lazy module loads.
   */
  async bootstrap(): Promise<{ summaries: IDashboardSummary[] }> {
    await this.#ensureStorage();
    return { summaries: await this.#loadSummaries() };
  }

  async saveSummary(source: string, metrics: Record<string, number | string>) {
    // Route through the init-once guard: the eager telemetry reporters emit
    // their first `report` synchronously at effect-registration time (before
    // provideAppInitializer dispatches the load actions), so persistSummary$
    // can call this before create()/bootstrap() have run. Ionic Storage.set()
    // throws synchronously when the backend isn't created yet — await here so
    // the write always sees an initialized store.
    await this.#ensureStorage();
    const summary: IDashboardSummary = { source, metrics };
    return this.#storageService.set('npc-summary-' + source, summary);
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

  async #loadSummaries(): Promise<IDashboardSummary[]> {
    const summaries: IDashboardSummary[] = [];
    await this.#storageService.forEach(
      (value: IDashboardSummary, key: string) => {
        if (key.startsWith('npc-summary-')) summaries.push(value);
      }
    );
    return summaries;
  }

  // Per-key persistence port. Keyed by a plain string (not `keyof IDatastore`)
  // so the kernel doesn't have to enumerate every context's slice type — each
  // bounded context owns its own key + shape and calls save<TItsOwnSlice>(...).
  async save<T>(key: string, value: T | null | undefined) {
    return await this.#storageService.set('npc-' + key, value);
  }
}
