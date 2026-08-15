import { DispatchableAction } from './dispatchable-action.types';

export type UndoEntry = {
  name: string;
  action: DispatchableAction;
};

export interface UndoState {
  entries: UndoEntry[];
}
