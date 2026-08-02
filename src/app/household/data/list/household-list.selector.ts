/* ─── why ─────────────────────────────────────────────────────────
 * Shopping is what a household route without a `:listId` resolves to, and
 * `selectActiveHouseholdListId` is the one place that says so. The default
 * used to be re-declared in three: the list-page facade, the catalog-page
 * facade and the quick-add selector, so changing which list a bare route
 * lands on was a three-file edit with no compiler linking them.
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
import { selectRouteParams as selectRouteParameters } from '../router.selector';
import { selectHouseholdState } from '../household.selector';

export const selectListIdParameter = createSelector(
  selectRouteParameters,
  (parameters): HouseholdListId | undefined => {
    const listId = parameters?.['listId'];
    return isHouseholdListId(listId) ? listId : undefined;
  }
);

export const selectActiveHouseholdListId = createSelector(
  selectListIdParameter,
  (listId): HouseholdListId => listId ?? SHOPPING_LIST_ID
);

export const selectListState = createSelector(
  selectListIdParameter,
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
