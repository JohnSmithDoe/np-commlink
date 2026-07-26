import { Injectable } from '@angular/core';

/**
 * Which persisted keys have been read back successfully at least once.
 *
 * A failed read is indistinguishable from an absent key by the time it reaches
 * a reducer — both arrive as `loaded(null)` and both fall back to initialState.
 * Persisting that fallback would overwrite bytes that are still on disk, which
 * is the one thing `versioned.ts` promises never happens. So the save effect
 * stays muted for a key until its read has actually resolved, which also closes
 * the boot window an eager context writes in before its read comes back.
 *
 * An absent key counts as a success: the read resolved, there was simply
 * nothing there. Only a rejected read or a throwing migration step withholds
 * the key.
 */
@Injectable({ providedIn: 'root' })
export class PersistedReadRegistry {
  readonly #read = new Set<string>();

  recordRead(key: string): void {
    this.#read.add(key);
  }

  mayPersist(key: string): boolean {
    return this.#read.has(key);
  }
}
