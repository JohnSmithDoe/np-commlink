/* ─── why ─────────────────────────────────────────────────────────
 * The catalog page could not add, rename or add-from-search a category,
 * and the cause was this file's absence, not the dialog.
 * `addOrUpdateItem`/`addItemFromSearch` are ROUTING actions no reducer
 * handles — the factory below turns them into real writes. Unregistered,
 * they died silently, while the inline picker kept working because it
 * dispatches `addItem` itself.
 *
 * So the REGISTRATION in the context is the load-bearing half, not this
 * file: every test here passed against the unregistered version.
 * ───────────────────────────────────────────────────────────────── */

import {
  clearSearchAfter,
  createItemListEffects,
} from '../../../@shared/data/item-lists/item-list.effects.factory';
import { createCategory } from '../../../@shared/util/app.factory';
import { selectHouseholdCategoryList } from './household-categories.selector';
import { HouseholdCategoriesActions } from './household-categories.actions';

export const householdCategoriesListEffects = {
  ...createItemListEffects({
    actions: HouseholdCategoriesActions,
    select: selectHouseholdCategoryList,
    create: (name) => createCategory(name),
  }),

  clearSearch$: clearSearchAfter(HouseholdCategoriesActions.updateSearch, [
    HouseholdCategoriesActions.addItem,
    HouseholdCategoriesActions.removeItem,
  ]),
};
