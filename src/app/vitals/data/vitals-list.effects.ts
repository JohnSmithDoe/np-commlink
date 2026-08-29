/* ─── why ─────────────────────────────────────────────────────────
 * Readings match on `findById` rather than the factory's default. The
 * default falls back to matching NAMES, and a reading's name is its date,
 * so saving the cat's first reading for today would have updated mine.
 *
 * `create` is null for a related reason: `addItemFromSearch` would name a
 * reading after the search box. With no creator the shared list page opens
 * the create dialog instead, which seeds today.
 *
 * Refusing a second reading for one date is the dialog's job:
 * `requireUniqueName` over the profile's own readings cannot save the
 * collision in the first place.
 *
 * Pills match on the id for a neighbouring reason: their uniqueness rule
 * is scoped to ONE profile, so two profiles may each hold an "Ibuprofen"
 * — and the default matcher, searching every profile's pills by name,
 * would edit the wrong one. Their `create` is null because a pill without
 * a profile is not a pill, and a search box does not carry one.
 * ───────────────────────────────────────────────────────────────── */

import { createItemListEffects } from '../../@shared/data/item-lists/item-list.effects.factory';
import { findById } from '../../@shared/util/app.utils';
import { READINGS_LIST_ID } from '../model/vitals.types';
import { createProfile } from '../util/vitals.factory';
import { PillsActions } from './pills/pills.actions';
import { ProfilesActions } from './profiles/profiles.actions';
import { ReadingsActions } from './readings/readings.actions';
import {
  selectPillsList,
  selectProfilesList,
  selectReadingsList,
} from './vitals.selector';

export const profilesListEffects = createItemListEffects({
  actions: ProfilesActions,
  select: selectProfilesList,
  create: (name) => createProfile(name),
});

export const readingsListEffects = createItemListEffects({
  actions: ReadingsActions,
  select: selectReadingsList,
  create: null,
  match: findById,
  undoableDelete: {
    scope: READINGS_LIST_ID,
    removeItem: ReadingsActions.removeItem,
  },
});

export const pillsListEffects = createItemListEffects({
  actions: PillsActions,
  select: selectPillsList,
  create: null,
  match: findById,
});
