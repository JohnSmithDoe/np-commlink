import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { EmojiActions } from './emoji.actions';

@Injectable({ providedIn: 'root' })
export class EmojiRecentsFacade {
  readonly #store = inject(Store);

  remember(glyphs: readonly string[]): void {
    if (glyphs.length === 0) return;
    this.#store.dispatch(EmojiActions.used(glyphs));
  }
}
