import { signal, Service } from '@angular/core';

@Service()
export class ReadBeforeWriteService {
  readonly #read = signal<ReadonlySet<string>>(new Set());

  recordRead(key: string): void {
    this.#read.update((read) => new Set(read).add(key));
  }

  mayPersist(key: string): boolean {
    return this.#read().has(key);
  }
}
