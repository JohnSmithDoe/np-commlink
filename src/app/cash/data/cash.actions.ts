import { createActionGroup, emptyProps } from '@ngrx/store';
import { CashAccount } from '../model/account.types';
import { CashState } from '../model/cash.types';
import { CashRule } from '../model/rule.types';
import { CashTransaction } from '../model/transaction.types';
import { CashRecategorization } from '../util/categorize.utils';
import { Category, CategoryId } from '../../@shared/model/category.types';
import { ItemListSortType } from '../../@shared/model/item-list.types';

export const CashActions = createActionGroup({
  source: 'Cash',
  events: {
    load: emptyProps(),
    loaded: (cash: CashState | null) => ({ cash }),

    addAccount: (account: CashAccount) => ({ account }),
    updateAccount: (account: CashAccount) => ({ account }),
    removeAccount: (id: string) => ({ id }),

    addTransaction: (transaction: CashTransaction) => ({ transaction }),
    updateTransaction: (transaction: CashTransaction) => ({ transaction }),
    removeTransaction: (id: string) => ({ id }),
    importTransactions: (transactions: CashTransaction[]) => ({
      transactions,
    }),
    bookTransfer: (fromLeg: CashTransaction, toLeg: CashTransaction) => ({
      fromLeg,
      toLeg,
    }),
    setTransactionCategory: (
      id: string,
      categoryId: CategoryId | undefined,
      manual: boolean
    ) => ({ id, categoryId, manual }),
    recategorizeTransactions: (changes: CashRecategorization[]) => ({
      changes,
    }),
    reconcileTransaction: (manualId: string, importedId: string) => ({
      manualId,
      importedId,
    }),
    unreconcileTransaction: (manualId: string) => ({ manualId }),

    addCategory: (category: Category) => ({ category }),
    updateCategorySearch: (searchQuery?: string) => ({ searchQuery }),
    updateCategorySort: (
      sortBy?: ItemListSortType,
      sortDirection?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDirection }),
    removeCategory: (id: CategoryId) => ({ id }),
    updateCategory: (id: CategoryId, name: string) => ({ id, name }),

    addRule: (rule: CashRule) => ({ rule }),
    updateRule: (rule: CashRule) => ({ rule }),
    removeRule: (id: string) => ({ id }),
    reorderRules: (ids: string[]) => ({ ids }),
  },
});
