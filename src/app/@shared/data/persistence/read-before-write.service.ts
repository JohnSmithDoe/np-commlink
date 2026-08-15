import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReadBeforeWriteService {
  readonly #read = new Set<string>();

  recordRead(key: string): void {
    this.#read.add(key);
  }

  mayPersist(key: string): boolean {
    return this.#read.has(key);
  }
}
