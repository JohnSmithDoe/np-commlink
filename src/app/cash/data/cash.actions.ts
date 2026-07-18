import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  ICashAccount,
  ICashRule,
  ICashState,
  ICashTransaction,
} from '../model';

// Source prefix `[Cash]` is load-bearing: CashSaveEffects.saveCashOnChange$
// persists the slice whenever any `[Cash]` action fires — EXCEPT the
// load/loaded lifecycle below, which that effect excludes (hydration is not a
// mutation; persisting on `[Cash] load` would clobber the ledger at boot).
export const CashActions = createActionGroup({
  source: 'Cash',
  events: {
    // Own-data lazy load lifecycle (lazy-modules plan §2).
    load: emptyProps(),
    loaded: (cash: ICashState | null) => ({ cash }),

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
    // Bulk append from a CSV import — one action = one persist.
    'Import Transactions': (transactions: ICashTransaction[]) => ({
      transactions,
    }),
    // A transfer between own accounts: both legs booked atomically.
    'Book Transfer': (fromLeg: ICashTransaction, toLeg: ICashTransaction) => ({
      fromLeg,
      toLeg,
    }),
    'Set Transaction Category': (
      id: string,
      category: string | undefined,
      manual: boolean
    ) => ({ id, category, manual }),
    // Merge a pending manual entry into the imported txn it turned out to be:
    // the manual leg points at the survivor and is hidden from balance/spend.
    'Reconcile Transaction': (manualId: string, importedId: string) => ({
      manualId,
      importedId,
    }),
    // Reverse a reconciliation: detach the manual leg from its survivor and
    // restore it to `pending` (visible + counted again).
    'Unreconcile Transaction': (manualId: string) => ({ manualId }),

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
