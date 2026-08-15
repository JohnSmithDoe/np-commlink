import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { CashTransaction } from '../../model/transaction.types';
import { CashRecategorization } from '../../util/categorize.utils';

export const CashTransactionsActions = createActionGroup({
  source: 'Cash Transactions',
  events: {
    ...createItemListActionEvents<CashTransaction>(),

    importItems: (items: CashTransaction[]) => ({ items }),
    bookTransfer: (fromLeg: CashTransaction, toLeg: CashTransaction) => ({
      fromLeg,
      toLeg,
    }),
    recategorize: (changes: CashRecategorization[]) => ({ changes }),
    reconcile: (manualId: string, importedId: string) => ({
      manualId,
      importedId,
    }),
    unreconcile: (manualId: string) => ({ manualId }),
  },
});
