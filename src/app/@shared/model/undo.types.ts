import { DispatchableAction } from './dispatchable-action.types';
import { ItemListId } from './item-list.types';

export type UndoEntry = {
  scope: ItemListId;
  name: string;
  action: DispatchableAction;
};

export interface UndoState {
  entries: UndoEntry[];
}
