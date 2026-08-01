import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { EmojiActions } from './emoji.actions';

/**
 * The dispatcher for {@link EmojiActions}, so `BaseEditItemDialog` can record a
 * used emoji without importing `@ngrx` — which `commlink/ngrx-data-layer-only`
 * permits only under `data/`, and `@shared/feature` is not that.
 *
 * Write-only by design: it exposes no read, because it names no store key. The
 * recents come back out through `EmojiRecentsService`'s mirror signal, fed by
 * `SettingsEffects` from inside the domain that owns the slice — the same
 * arrangement `ThemeService` has with the theme.
 */
@Injectable({ providedIn: 'root' })
export class EmojiRecentsFacade {
  readonly #store = inject(Store);

  remember(glyphs: readonly string[]): void {
    if (glyphs.length === 0) return;
    this.#store.dispatch(EmojiActions.used(glyphs));
  }
}
