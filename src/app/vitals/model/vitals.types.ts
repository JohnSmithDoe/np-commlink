/* ─── why ─────────────────────────────────────────────────────────
 * A reading's `name` IS its date, `YYYY-MM-DD`. The shared list machinery
 * keys a row on `name` — the searchbar, the create dialog's uniqueness
 * rule, the chronological sort — so spelling the date in a second field
 * would mean two places holding one fact, and "one reading per profile per
 * day" would need defending twice. What `name` does not buy is identity;
 * `vitals-list.effects.ts` says what that costs.
 *
 * A pill's `slot` is the block of OS notification ids it owns, and
 * `nextSlot` only ever counts up — deleting a pill frees its block and
 * nothing claims it again. Reuse would be safe only as long as every
 * cancel and schedule stays ordered, and a counter costs one integer to
 * never have to re-establish that. `weekdays` is ISO (Monday 1), not the
 * plugin's Sunday-first enum: this shape outlives the plugin.
 * ───────────────────────────────────────────────────────────────── */

import { IsoWeekday, Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { ItemList } from '../../@shared/model/item-list.types';

export type VitalsId = string;
export type ISODate = string;

export const PROFILES_LIST_ID = '_vitals-profiles';
export const READINGS_LIST_ID = '_vitals-readings';
export const PILLS_LIST_ID = '_vitals-pills';

export type ProfileType = 'person' | 'pet';

export interface Profile extends BaseItem {
  createdAt: Timestamp;
  type: ProfileType;
}

export interface Reading extends BaseItem {
  createdAt: Timestamp;
  profileId: VitalsId;
  grams: number;
}

export interface Pill extends BaseItem {
  createdAt: Timestamp;
  profileId: VitalsId;
  dose: number;
  hour: number;
  minute: number;
  weekdays: IsoWeekday[];
  remind: boolean;
  slot: number;
}

interface PillIntake {
  pillId: VitalsId;
  takenOn: ISODate;
}

export type ProfilesState = Readonly<
  ItemList<Profile> & { id: typeof PROFILES_LIST_ID }
>;
export type ReadingsState = Readonly<
  ItemList<Reading> & { id: typeof READINGS_LIST_ID }
>;
export type PillsState = Readonly<
  ItemList<Pill> & { id: typeof PILLS_LIST_ID; nextSlot: number }
>;
export type IntakesState = readonly PillIntake[];

export interface ProfileSummary {
  count: number;
  latestGrams?: number;
  deltaGrams?: number;
}

export interface VitalsState {
  profiles: ProfilesState;
  readings: ReadingsState;
  pills: PillsState;
  intakes: IntakesState;
}
