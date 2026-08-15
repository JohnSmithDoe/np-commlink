/* ─── why ─────────────────────────────────────────────────────────
 * The envelope ships a `sort` of its own, `order` ascending, because a
 * rule list is not a list the user sorts — it is a list the user
 * ARRANGES, and the arrangement is the semantics: `categorize` returns
 * the first matching rule. `itemComparator` routes a numeric field to
 * the number comparator, so the drag handle keeps writing `order` and
 * the shared sort keeps reading it.
 * ───────────────────────────────────────────────────────────────── */
import { createReducer, on } from '@ngrx/store';
import {
  hydratedList,
  addListItem,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/item-lists/list.utils';
import { CASH_RULES_LIST_ID, CashRulesState } from '../../model/cash.types';
import { CashRule } from '../../model/rule.types';
import { CashActions } from '../cash.actions';
import { CashRulesActions } from './cash-rules.actions';

const initialRulesState: CashRulesState = {
  id: CASH_RULES_LIST_ID,
  items: [],
  sort: { sortBy: 'order', sortDirection: 'asc' },
};

const reordered = (items: readonly CashRule[], ids: string[]): CashRule[] => {
  const byId = new Map(items.map((rule) => [rule.id, rule]));
  const moved = ids.flatMap((id, index) => {
    const rule = byId.get(id);
    if (!rule) return [];
    byId.delete(id);
    return [{ ...rule, order: index }];
  });
  const untouched = [...byId.values()].map((rule, index) => ({
    ...rule,
    order: moved.length + index,
  }));
  return [...moved, ...untouched];
};

// prettier-ignore
export const cashRulesReducer = createReducer(
  initialRulesState,
  on(CashRulesActions.addItem, (state, { item }): CashRulesState => addListItem(state, item)),
  on(CashRulesActions.removeItem, (state, { item }): CashRulesState => removeListItem(state, item)),
  on(CashRulesActions.updateItem, (state, { item }): CashRulesState => updateListItem(state, item)),
  on(CashRulesActions.updateSearch, (state, { searchQuery }): CashRulesState => updateListSearch(state, searchQuery)),
  on(CashRulesActions.updateFilter, (state, { filterBy }): CashRulesState => ({ ...state, filterBy })),
  on(CashRulesActions.updateSort, (state, { sortBy, sortDirection }): CashRulesState => updateListSort(state, sortBy, sortDirection)),

  on(CashRulesActions.reorder, (state, { ids }): CashRulesState => ({
    ...state,
    items: reordered(state.items, ids),
  })),

  on(CashActions.loaded, (state, { cash }): CashRulesState => hydratedList(cash?.rules ?? state))
);
