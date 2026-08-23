import { createSelector } from '@ngrx/store';
import { SearchResult } from '../../../@shared/model/item-list.types';
import { filterListBySearchQuery } from '../../../@shared/util/item-lists/list.selector';
import { CashRulesState } from '../../model/cash.types';
import { CashRule } from '../../model/rule.types';
import { RuleStat, ruleStats } from '../../util/categorize.utils';
import { selectAllTransactions, selectCashState } from '../cash.selector';

export const selectRulesState = createSelector(
  selectCashState,
  (state): CashRulesState => state.rules
);

export const selectRuleItems = createSelector(
  selectRulesState,
  (state): CashRule[] => state.items
);

export const selectRulesSearchResult = createSelector(
  selectRulesState,
  (state): SearchResult<CashRule> | undefined => filterListBySearchQuery(state)
);

export const selectRuleStats = createSelector(
  selectAllTransactions,
  selectRuleItems,
  (transactions, rules): Record<string, RuleStat> =>
    ruleStats(transactions, rules)
);

export const selectArrangedRules = createSelector(
  selectRuleItems,
  (rules): CashRule[] => rules.toSorted((a, b) => a.order - b.order)
);
