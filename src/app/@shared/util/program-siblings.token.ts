/* ─── why ─────────────────────────────────────────────────────────
 * The third port onto `DECK_CATALOG`, after `PROGRAM_ICON` and
 * `PROGRAM_RETURN`: which programs sit beside this one. `@shared` may not
 * reach the catalog, and the tab bar may not know a module exists.
 *
 * The question is asked with a URL PREFIX rather than a module name, so the
 * answer is a fact about the address bar: a tab is a program exactly one
 * segment below the shell. A program further down — `/vitals/iching/cast`
 * under a `/vitals` shell — is a page inside a tab's stack, and the same
 * lookup says so without a second rule.
 * ───────────────────────────────────────────────────────────────── */
import { InjectionToken } from '@angular/core';

export interface ProgramSibling {
  readonly id: string;
  readonly segment: string;
  readonly icon: string;
  readonly titleKey: string;
}

const noSiblings = (): readonly ProgramSibling[] => [];

export const PROGRAM_SIBLINGS = new InjectionToken<
  (prefix: string) => readonly ProgramSibling[]
>('PROGRAM_SIBLINGS', { factory: () => noSiblings });
