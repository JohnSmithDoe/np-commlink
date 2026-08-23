/* ─── why ─────────────────────────────────────────────────────────
 * It lives in `data/` and not beside `list.selector.ts` because the scope
 * is `selectRouteEntityId`, and Sheriff seals `util → data`. The four
 * selectors are one chain, not four choices: search runs over the SCOPED
 * list, so a query typed on one profile's page cannot match another's row.
 * ───────────────────────────────────────────────────────────────── */
import { createSelector, MemoizedSelector } from '@ngrx/store';
import { BaseItem } from '../../model/base-item.types';
import { ItemList, SearchResult } from '../../model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../util/item-lists/list.selector';
import { selectRouteEntityId } from '../router/router.selector';

export const createRouteScopedListSelectors = <
  T extends BaseItem,
  S extends ItemList<T>,
>(
  selectList: MemoizedSelector<object, S>,
  scopedTo: (items: T[], entityId: string) => T[]
) => {
  const selectItems = createSelector(selectList, (list): T[] => list.items);

  const selectScopedItems = createSelector(
    selectItems,
    selectRouteEntityId,
    (items, entityId): T[] => (entityId ? scopedTo(items, entityId) : [])
  );

  const selectScopedList = createSelector(
    selectList,
    selectScopedItems,
    (list, items): S => ({ ...list, items })
  );

  const selectSearchResult = createSelector(
    selectScopedList,
    (list): SearchResult<T> | undefined => filterListBySearchQuery(list)
  );

  const selectListItems = createSelector(
    selectScopedList,
    selectSearchResult,
    (list, result): T[] => filterAndSortItemList(list, result)
  );

  return {
    selectItems,
    selectScopedItems,
    selectSearchResult,
    selectListItems,
  };
};
