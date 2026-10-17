/* ─── why ─────────────────────────────────────────────────────────
 * People are owned by `people`, and BIOMON and TRACKPLAY key their own
 * records on a person's id. Sealed domains cannot import the owner, so
 * the kernel publishes the roster here, read-only.
 *
 * `undefined` means the roster has not been READ yet — a failed read
 * included. An empty list is a real answer, and a domain sweeping its
 * orphans against one would delete every record it holds.
 * ───────────────────────────────────────────────────────────────── */
import { InjectionToken, signal, Signal } from '@angular/core';
import { PersonRef } from '../../model/person.types';

export type Roster = readonly PersonRef[] | undefined;

export const PEOPLE = new InjectionToken<Signal<Roster>>('PEOPLE', {
  factory: () => signal<Roster>(undefined).asReadonly(),
});

export const PEOPLE_ROUTE = '/people';
