import { Injectable, Signal, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EmojiRecentsService {
  readonly #recent = signal<readonly string[]>([]);
  readonly recent: Signal<readonly string[]> = this.#recent.asReadonly();

  publish(glyphs: readonly string[]): void {
    this.#recent.set(glyphs);
  }
}
