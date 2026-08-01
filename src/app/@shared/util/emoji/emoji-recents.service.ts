import { Injectable, Signal, signal } from '@angular/core';

/**
 * Publishes the recently-used emoji for readers that may not select them.
 *
 * The exact sibling of `ThemeService`/`LanguageService`, for the same reason:
 * the value lives on the `settings` slice, and the picker that renders it is
 * `@shared/ui`, which may reach neither `type:data` nor `domain:settings`. So
 * `SettingsEffects` mirrors the selector onto this signal — the one layer every
 * domain may import — and the picker reads it like any other input.
 *
 * It holds no source of truth and does no IO: the recents are persisted with the
 * rest of `npc-settings` by that context's own save effect. `apply()` is
 * deliberately not the verb its siblings use — there is no global to write here,
 * only a value to republish.
 */
@Injectable({ providedIn: 'root' })
export class EmojiRecentsService {
  readonly #recent = signal<readonly string[]>([]);
  readonly recent: Signal<readonly string[]> = this.#recent.asReadonly();

  publish(glyphs: readonly string[]): void {
    this.#recent.set(glyphs);
  }
}
