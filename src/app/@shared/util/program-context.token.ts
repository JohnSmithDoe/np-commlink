/* ─── why ─────────────────────────────────────────────────────────
 * One port onto `DECK_CATALOG`, asked with a URL. `@shared` may not reach
 * the catalog, and the three questions a shell asks about a route — which
 * glyph it wears, what it returns to, which programs sit beside it — are
 * three readings of ONE lookup, so they arrive together.
 *
 * A LOOKUP and not a signal over the current URL. Ionic keeps the leaving
 * page mounted through a transition, so a page reading "where am I now"
 * answers for the page that replaced it: its glyph flips and its return row
 * points at its own child while it slides away. Each page asks about the
 * route it was activated on, which is a fact that never moves under it.
 *
 * `isProgram` is the half that cannot be modelled as an absent parent. A URL
 * that IS a deck entry's own route has no parent by construction, and that is
 * a different answer from a URL the catalog does not know at all: the first
 * vetoes a return row outright, the second leaves the page free to name its
 * own. `siblings` is asked of the URL as a PREFIX — a tab is a program
 * exactly one segment below the shell, so a program further down is a page
 * inside a tab's stack and the same lookup says so without a second rule.
 * ───────────────────────────────────────────────────────────────── */
import { InjectionToken } from '@angular/core';

interface ProgramParent {
  readonly route: string;
  readonly titleKey: string;
}

export interface ProgramSibling {
  readonly id: string;
  readonly segment: string;
  readonly icon: string;
  readonly titleKey: string;
}

export interface ProgramContext {
  readonly icon?: string;
  readonly isProgram: boolean;
  readonly parent?: ProgramParent;
  readonly siblings: readonly ProgramSibling[];
}

const noProgram = (): ProgramContext => ({ isProgram: false, siblings: [] });

export const PROGRAM_CONTEXT = new InjectionToken<
  (url: string) => ProgramContext
>('PROGRAM_CONTEXT', { factory: () => noProgram });
