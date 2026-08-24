/* ─── why ─────────────────────────────────────────────────────────
 * The glyph a program is known by lives in `DECK_CATALOG`, which the deck
 * and the side menu already read. The page header is `@shared/ui` and may
 * reach neither `data/` nor another domain's model, so it cannot look the
 * entry up — the same inversion as `LIST_FACADE` and `RECENT_EMOJIS`.
 *
 * The empty default keeps it optional: a header rendered with no deck
 * context shows its own `icon` or none, rather than failing to construct.
 * ───────────────────────────────────────────────────────────────── */
import { InjectionToken, signal, Signal } from '@angular/core';

export const PROGRAM_ICON = new InjectionToken<Signal<string | undefined>>(
  'PROGRAM_ICON',
  { factory: () => signal<string | undefined>(undefined).asReadonly() }
);
