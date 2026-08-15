import { createActionGroup, emptyProps } from '@ngrx/store';
import { CashState } from '../model/cash.types';

export const CashActions = createActionGroup({
  source: 'Cash',
  events: {
    load: emptyProps(),
    loaded: (cash: CashState | null) => ({ cash }),
  },
});
