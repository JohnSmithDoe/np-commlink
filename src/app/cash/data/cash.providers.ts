import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { CashActions } from './cash.actions';
import {
  cashAccountsListEffects,
  cashCategoriesListEffects,
} from './cash-list.effects';
import { cashReducer } from './cash.reducer';
import {
  CASH_STATE_KEY,
  selectCashBalanceEuros,
  selectCashState,
} from './cash.selector';

export const cashContext = providePersistedContext({
  key: CASH_STATE_KEY,
  reducer: cashReducer,
  lifecycle: CashActions,
  select: selectCashState,
  effects: [cashAccountsListEffects, cashCategoriesListEffects],
  save: {
    sources: [
      '[Cash]',
      '[Cash Accounts]',
      '[Cash Transactions]',
      '[Cash Rules]',
      '[Cash Categories]',
    ],
  },
  telemetry: [
    {
      source: 'cash',
      select: selectCashBalanceEuros,
      metrics: createMetric('balance'),
    },
  ],
});
