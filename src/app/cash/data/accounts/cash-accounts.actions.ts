import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { CashAccount } from '../../model/account.types';

export const CashAccountsActions = createActionGroup({
  source: 'Cash Accounts',
  events: createItemListActionEvents<CashAccount>(),
});
