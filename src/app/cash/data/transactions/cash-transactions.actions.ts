import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { CashTransaction } from '../../model/transaction.types';
import { CashRecategorization } from '../../util/categorize.utils';
import { ImportConfirmation } from '../../model/import.types';

export const CashTransactionsActions = createActionGroup({
  source: 'Cash Transactions',
  events: {
    ...createItemListActionEvents<CashTransaction>(),

    importItems: (
      items: CashTransaction[],
      confirmed: ImportConfirmation[] = []
    ) => ({ items, confirmed }),
    bookTransfer: (fromLeg: CashTransaction, toLeg: CashTransaction) => {
      return {
        fromLeg,
        toLeg,
      };
    },
    recategorize: (changes: CashRecategorization[]) => ({ changes }),
    reconcile: (manualId: string, importedId: string) => {
      return {
        manualId,
        importedId,
      };
    },
    unreconcile: (manualId: string) => ({ manualId }),
  },
});
