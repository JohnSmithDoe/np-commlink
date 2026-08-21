import { createSelector } from '@ngrx/store';
import { SearchResult } from '../../../@shared/model/item-list.types';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import { CashRulesState } from '../../model/cash.types';
import { CashRule } from '../../model/rule.types';
import { RuleStat, ruleStats } from '../../util/categorize.utils';
import { selectAllTransactions, selectCashState } from '../cash.selector';

const selectRulesState = createSelector(
  selectCashState,
  (state): CashRulesState => state.rules
);

export const selectRuleItems = createSelector(
  selectRulesState,
  (state): CashRule[] => state.items
);

const selectRulesSearchResult = createSelector(
  selectRulesState,
  (state): SearchResult<CashRule> | undefined => filterListBySearchQuery(state)
);

export const selectRuleStats = createSelector(
  selectAllTransactions,
  selectRuleItems,
  (transactions, rules): Record<string, RuleStat> =>
    ruleStats(transactions, rules)
);

export const selectRulesListItems = createSelector(
  selectRulesState,
  selectRulesSearchResult,
  (state, result): CashRule[] => filterAndSortItemList(state, result)
);
