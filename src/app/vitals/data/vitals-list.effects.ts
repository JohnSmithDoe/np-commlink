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
 * ───────────────────────────────────────────────────────────────── */

import { createItemListEffects } from '../../@shared/data/item-lists/item-list.effects.factory';
import { findById } from '../../@shared/util/app.utils';
import { createProfile } from '../util/vitals.factory';
import { ProfilesActions } from './profiles/profiles.actions';
import { ReadingsActions } from './readings/readings.actions';
import { selectProfilesList, selectReadingsList } from './vitals.selector';

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
  undoableDelete: ReadingsActions.removeItem,
});
