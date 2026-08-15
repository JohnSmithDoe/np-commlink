import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { CashRule } from '../../model/rule.types';

export const CashRulesActions = createActionGroup({
  source: 'Cash Rules',
  events: {
    ...createItemListActionEvents<CashRule>(),

    reorder: (ids: string[]) => ({ ids }),
  },
});
