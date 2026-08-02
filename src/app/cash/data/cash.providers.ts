import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { CashActions } from './cash.actions';
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
  save: { sources: ['[Cash]'] },
  telemetry: [
    {
      source: 'cash',
      select: selectCashBalanceEuros,
      metrics: createMetric('balance'),
    },
  ],
});
