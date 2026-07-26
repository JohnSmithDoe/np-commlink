import { providePersistedContext } from '../../@shared/data/persisted-context.provider';
import { createMetric } from '../../@shared/data/effects/persisted-slice.effects.factory';
import { CashActions } from './actions/cash.actions';
import { cashReducer } from './reducer/cash.reducer';
import {
  selectCashBalanceEuros,
  selectCashState,
} from './selectors/cash.selector';

/**
 * The `cash` bounded context, registered on every `/cash*` route.
 *
 * Cash is fully self-contained — no other route reads or dispatches `[Cash]` —
 * so it registers on its own, and each sibling route re-registers it.
 */
export const cashContext = providePersistedContext({
  key: 'cash',
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
