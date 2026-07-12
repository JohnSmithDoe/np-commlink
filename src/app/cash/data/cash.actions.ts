import { createActionGroup, emptyProps } from '@ngrx/store';
import { ICashAccount, ICashRule, ICashTransaction } from '../../@shared/types';

// Source prefix `[Cash]` is load-bearing: AppEffects.saveCashOnChange$
// persists the slice whenever any `[Cash]` action fires.
export const CashActions = createActionGroup({
  source: 'Cash',
  events: {
    // Effects only
    'Enter Page': emptyProps(),

    // Accounts
    'Add Account': (account: ICashAccount) => ({ account }),
    'Update Account': (account: ICashAccount) => ({ account }),
    'Remove Account': (id: string) => ({ id }),

    // Transactions
    'Add Transaction': (transaction: ICashTransaction) => ({ transaction }),
    'Update Transaction': (transaction: ICashTransaction) => ({ transaction }),
    'Remove Transaction': (id: string) => ({ id }),
    'Set Transaction Category': (
      id: string,
      category: string | undefined,
      manual: boolean
    ) => ({ id, category, manual }),

    // Categories (user-managed name list)
    'Add Category': (category: string) => ({ category }),
    'Remove Category': (category: string) => ({ category }),

    // Email-style filter rules (ordered; first match wins)
    'Add Rule': (rule: ICashRule) => ({ rule }),
    'Update Rule': (rule: ICashRule) => ({ rule }),
    'Remove Rule': (id: string) => ({ id }),
    'Reorder Rules': (ids: string[]) => ({ ids }),
  },
});
