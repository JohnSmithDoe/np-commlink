import { Marker } from './app.types';
import { DispatchableAction } from './dispatchable-action.types';
import { ItemListId } from './item-list.types';

export type UndoEntry = {
  scope: ItemListId;
  name: string;
  action: DispatchableAction;
  toastKey?: Marker;
};

export interface UndoState {
  entries: UndoEntry[];
}
