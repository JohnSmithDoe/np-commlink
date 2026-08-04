import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  readonly #storageService = inject(Storage);

  #ready?: Promise<unknown>;
  async #ensureStorage(): Promise<void> {
    await (this.#ready ??= this.#storageService.create());
  }

  async bootstrap(): Promise<void> {
    await this.#ensureStorage();
  }

  async load<T>(key: string): Promise<T | null> {
    await this.#ensureStorage();
    return this.#storageService.get('npc-' + key);
  }

  async loadPrefixed<T>(prefix: string): Promise<T[]> {
    await this.#ensureStorage();
    const keys = await this.#storageService.keys();
    const matching = keys.filter((key) => key.startsWith('npc-' + prefix));
    const documents: (T | null)[] = await Promise.all(
      matching.map((key) => this.#storageService.get(key))
    );
    return documents.filter(
      (storedDocument): storedDocument is T => storedDocument !== null
    );
  }

  async save<T>(key: string, value: T | null | undefined) {
    const write = this.#write(key, value);
    this.#pendingWrites.add(write);
    try {
      return await write;
    } finally {
      this.#pendingWrites.delete(write);
    }
  }

  async settled(): Promise<void> {
    await Promise.allSettled(this.#pendingWrites);
  }

  readonly #pendingWrites = new Set<Promise<unknown>>();

  async #write<T>(key: string, value: T | null | undefined) {
    await this.#ensureStorage();
    return await this.#storageService.set('npc-' + key, value);
  }
}
