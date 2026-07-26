import { createActionGroup } from '@ngrx/store';
import { IQuickAddState } from '../../model/list-settings.types';

export const QuickAddActions = createActionGroup({
  source: 'QuickAdd',
  events: {
    updateState: (newState: IQuickAddState) => ({ newState }),
  },
});
