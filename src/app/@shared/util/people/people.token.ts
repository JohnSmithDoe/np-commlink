/* ─── why ─────────────────────────────────────────────────────────
 * People are owned by `people`, and BIOMON and TRACKPLAY key their own
 * records on a person's id. Sealed domains cannot import the owner, so
 * the kernel publishes the roster here, read-only. A reference survives
 * its person: a removed id simply stops resolving, and an undo makes it
 * resolve again, so no domain cascades into another's slice.
 * ───────────────────────────────────────────────────────────────── */
import { InjectionToken, signal, Signal } from '@angular/core';
import { PersonRef } from '../../model/person.types';

export const PEOPLE = new InjectionToken<Signal<readonly PersonRef[]>>(
  'PEOPLE',
  { factory: () => signal<readonly PersonRef[]>([]).asReadonly() }
);

export const PEOPLE_ROUTE = '/people';
