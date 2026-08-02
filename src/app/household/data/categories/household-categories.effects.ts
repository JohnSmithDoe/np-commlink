/* ─── why ─────────────────────────────────────────────────────────
 * The catalog page could not add, rename or add-from-search a category,
 * and the cause was this file's absence rather than anything in the
 * dialog. BaseCategoryListPageFacade dispatches `addOrUpdateItem` and
 * `addItemFromSearch`, which are ROUTING actions a reducer is not
 * supposed to handle — the factory below is what turns them into
 * `addItem` or `updateItem`. With nothing registered they reached no
 * reducer case and no effect and died silently, while the inline picker
 * in an item dialog kept working because it dispatches `addItem` itself.
 * Tasks never had the bug because it registered the same factory for its
 * own catalog from the start.
 *
 * So the registration in the context is the load-bearing half, not this
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
