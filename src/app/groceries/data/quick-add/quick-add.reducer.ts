import { createReducer, on } from '@ngrx/store';
import { IQuickAddState } from '../../model';
import { QuickAddActions } from './quick-add.actions';

export const initialQuickAdd: IQuickAddState = {
  canAddLocal: false,
  canAddProduct: false,
  canAddCategory: false,
  searchQuery: undefined,
};
export const quickAddReducer = createReducer(
  initialQuickAdd,
  on(QuickAddActions.updateState, (_, { newState }): IQuickAddState => {
    return newState;
  })
);
