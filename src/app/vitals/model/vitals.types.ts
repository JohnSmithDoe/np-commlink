/* ─── why ─────────────────────────────────────────────────────────
 * A reading's `name` IS its date, `YYYY-MM-DD`. The shared list machinery
 * keys a row on `name` — the searchbar, the create dialog's uniqueness
 * rule, the chronological sort — so spelling the date in a second field
 * would mean two places holding one fact, and "one reading per profile per
 * day" would need defending twice. What `name` does not buy is identity;
 * `vitals-list.effects.ts` says what that costs.
 * ───────────────────────────────────────────────────────────────── */

import { Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { ItemList } from '../../@shared/model/item-list.types';

export type VitalsId = string;
export type ISODate = string;

export const PROFILES_LIST_ID = '_vitals-profiles';
export const READINGS_LIST_ID = '_vitals-readings';

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

export type ProfilesState = Readonly<
  ItemList<Profile> & { id: typeof PROFILES_LIST_ID }
>;
export type ReadingsState = Readonly<
  ItemList<Reading> & { id: typeof READINGS_LIST_ID }
>;

export interface ProfileSummary {
  count: number;
  latestGrams?: number;
  deltaGrams?: number;
}

export interface VitalsState {
  profiles: ProfilesState;
  readings: ReadingsState;
}
