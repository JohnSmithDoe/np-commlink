/* ─── why ─────────────────────────────────────────────────────────
 * The port `PROGRAM_ICON` opened, asked the other question: not which glyph
 * a page wears, but which program CONTAINS it. Same inversion — the return
 * row is `@shared/ui` and may reach neither `data/` nor `DECK_CATALOG`.
 *
 * A LOOKUP and not a signal over the current URL, which is what the glyph
 * gets away with: Ionic keeps the leaving page mounted through a transition,
 * so a page reading "where am I now" answers for the page that replaced it —
 * a program then renders the row of its own child. Each page asks about the
 * route it was activated on, which is a fact that never moves under it.
 *
 * `isProgram` is the half that cannot be modelled as an absent parent. A URL
 * that IS a deck entry's own route has no parent by construction, and that is
 * a different answer from a URL the catalog does not know at all: the first
 * vetoes a return row outright, the second leaves the page free to name its
 * own.
 * ───────────────────────────────────────────────────────────────── */
import { InjectionToken } from '@angular/core';

interface ProgramParent {
  readonly route: string;
  readonly titleKey: string;
}

export interface ProgramReturn {
  readonly isProgram: boolean;
  readonly parent?: ProgramParent;
}

const noProgram = (): ProgramReturn => ({ isProgram: false });

export const PROGRAM_RETURN = new InjectionToken<
  (url: string) => ProgramReturn
>('PROGRAM_RETURN', { factory: () => noProgram });
