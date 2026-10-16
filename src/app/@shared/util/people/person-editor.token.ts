/* ─── why ─────────────────────────────────────────────────────────
 * The write half of `PEOPLE`: BIOMON and TRACKPLAY create a person without
 * leaving their page, and `people` keeps the dialog and its wording.
 * The shell mounts that dialog once; a copy on any page would answer
 * every request a second time.
 *
 * No default factory, unlike `PEOPLE` — a no-op editor is a button that
 * does nothing, so a missing provider must throw where it is injected.
 * ───────────────────────────────────────────────────────────────── */
import { InjectionToken } from '@angular/core';

export interface PersonEditor {
  create(name?: string): void;
}

export const PERSON_EDITOR = new InjectionToken<PersonEditor>('PERSON_EDITOR');
