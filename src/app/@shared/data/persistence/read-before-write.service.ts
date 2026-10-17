import { signal, Service } from '@angular/core';

@Service()
export class ReadBeforeWriteService {
  readonly #read = signal<ReadonlySet<string>>(new Set());

  recordRead(key: string): void {
    this.#read.update((read) => {
      const next = new Set(read);
      next.add(key);
      return next;
    });
  }

  mayPersist(key: string): boolean {
    return this.#read().has(key);
  }
}
