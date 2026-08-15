/* ─── why ─────────────────────────────────────────────────────────
 * Shopping is what a household route naming no list resolves to, and this
 * is the one place that says so — it used to be re-declared in three, so
 * changing it was a three-file edit with no compiler linking them.
 *
 * Two sources, and the split is the point. The list pages fix their list
 * in route DATA, because `/household/storage` already says which one it
 * is; the `:listId` segment it replaced repeated the path and promised
 * instances the closed union cannot supply. `categories/:listId` keeps its
 * param, because there the value genuinely varies — it carries which list
 * the catalog was opened from, so the back button can return.
 *
 * `selectListState` reads data only: the catalog page overrides
 * `state`/`items` with its own selectors, so resolving one there would be
 * an answer nobody asked for.
 * ───────────────────────────────────────────────────────────────── */

import { createSelector } from '@ngrx/store';
import { BaseItem } from '../../../@shared/model/base-item.types';
import { filterAndSortItemList } from '../../../@shared/util/item-lists/list.selector';
import {
  HouseholdListId,
  HouseholdSearchResult,
  isHouseholdListId,
  SHOPPING_LIST_ID,
} from '../../model/household-list.types';
import { stateByListId } from '../../util/household-list.utils';
import { filterBySearchQuery } from '../../util/household-search.utils';
import {
  selectRouteCategoryFilter,
  selectRouteData,
  selectRouteParams as selectRouteParameters,
} from '../../../@shared/data/router/router.selector';
import { selectHouseholdState } from '../household.selector';

const asHouseholdListId = (listId: unknown): HouseholdListId | undefined =>
  isHouseholdListId(typeof listId === 'string' ? listId : undefined)
    ? (listId as HouseholdListId)
    : undefined;

export const selectListIdFromRouteData = createSelector(
  selectRouteData,
  (data): HouseholdListId | undefined => asHouseholdListId(data?.['listId'])
);

export const selectListIdParameter = createSelector(
  selectRouteParameters,
  (parameters): HouseholdListId | undefined =>
    asHouseholdListId(parameters?.['listId'])
);

export const selectActiveHouseholdListId = createSelector(
  selectListIdFromRouteData,
  selectListIdParameter,
  (fromData, fromParameter): HouseholdListId =>
    fromData ?? fromParameter ?? SHOPPING_LIST_ID
);

export const selectDrilledCategory = createSelector(
  selectActiveHouseholdListId,
  selectRouteCategoryFilter,
  (listId, categoryId) => ({ listId, categoryId })
);

export const selectListState = createSelector(
  selectListIdFromRouteData,
  selectHouseholdState,
  (listId, lists) => {
    if (!listId) return;
    return stateByListId(lists, listId);
  }
);

export const selectListSearchResult = createSelector(
  selectListState,
  selectHouseholdState,
  (state, lists): HouseholdSearchResult<BaseItem> | undefined =>
    state ? filterBySearchQuery(lists, state) : undefined
);

export const selectListItems = createSelector(
  selectListState,
  selectListSearchResult,
  (state, result): BaseItem[] | undefined =>
    state ? filterAndSortItemList(state, result) : undefined
);
