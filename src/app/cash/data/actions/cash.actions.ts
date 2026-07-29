import { createActionGroup, emptyProps } from '@ngrx/store';
import { ICashAccount } from '../../model/account.types';
import { ICashState } from '../../model/cash.types';
import { ICashRule } from '../../model/rule.types';
import { ICashTransaction } from '../../model/transaction.types';
import { ICashRecategorization } from '../../util/categorize.utils';
import { ICategory, TCategoryId } from '../../../@shared/model/category.types';

// Source prefix `[Cash]` is load-bearing: CashSaveEffects.saveCashOnChange$
// persists the slice whenever any `[Cash]` action fires — EXCEPT the
// load/loaded lifecycle below, which that effect excludes (hydration is not a
// mutation; persisting on `[Cash] load` would clobber the ledger at boot).
export const CashActions = createActionGroup({
  source: 'Cash',
  events: {
    // Own-data lazy load lifecycle.
    load: emptyProps(),
    loaded: (cash: ICashState | null) => ({ cash }),

    // Effects only

    addAccount: (account: ICashAccount) => ({ account }),
    updateAccount: (account: ICashAccount) => ({ account }),
    removeAccount: (id: string) => ({ id }),

    addTransaction: (transaction: ICashTransaction) => ({ transaction }),
    updateTransaction: (transaction: ICashTransaction) => ({ transaction }),
    removeTransaction: (id: string) => ({ id }),
    // Bulk append from a CSV import — one action = one persist.
    importTransactions: (transactions: ICashTransaction[]) => ({
      transactions,
    }),
    // A transfer between own accounts: both legs booked atomically.
    bookTransfer: (fromLeg: ICashTransaction, toLeg: ICashTransaction) => ({
      fromLeg,
      toLeg,
    }),
    setTransactionCategory: (
      id: string,
      categoryId: TCategoryId | undefined,
      manual: boolean
    ) => ({ id, categoryId, manual }),
    // Bulk re-filing from an "apply rules" run — one action = one persist, where
    // one `setTransactionCategory` per changed row rewrote the whole ledger N
    // times. Rule-assigned, so never `manual`.
    recategorizeTransactions: (changes: ICashRecategorization[]) => ({
      changes,
    }),
    // Merge a pending manual entry into the imported txn it turned out to be:
    // the manual leg points at the survivor and is hidden from balance/spend.
    reconcileTransaction: (manualId: string, importedId: string) => ({
      manualId,
      importedId,
    }),
    // Reverse a reconciliation: detach the manual leg from its survivor and
    // restore it to `pending` (visible + counted again).
    unreconcileTransaction: (manualId: string) => ({ manualId }),

    // Categories ({id,name} catalog). Add carries a pre-minted category (the
    // picker mints the id the txn/rule will reference); Remove/Rename key by id.
    addCategory: (category: ICategory) => ({ category }),
    removeCategory: (id: TCategoryId) => ({ id }),
    // Rename is O(1) on the catalog; on a name collision it merges (remaps txn +
    // rule references from the old id onto the survivor).
    updateCategory: (id: TCategoryId, name: string) => ({ id, name }),

    // Email-style filter rules (ordered; first match wins)
    addRule: (rule: ICashRule) => ({ rule }),
    updateRule: (rule: ICashRule) => ({ rule }),
    removeRule: (id: string) => ({ id }),
    reorderRules: (ids: string[]) => ({ ids }),
  },
});
