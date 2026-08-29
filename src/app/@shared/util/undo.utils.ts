import { ItemListId } from '../model/item-list.types';
import { UndoEntry } from '../model/undo.types';

export const newestIn = (
  entries: readonly UndoEntry[],
  scope: ItemListId
): UndoEntry | undefined => entries.findLast((entry) => entry.scope === scope);

export const indexOfNewestIn = (
  entries: readonly UndoEntry[],
  scope: ItemListId
): number => entries.findLastIndex((entry) => entry.scope === scope);

export const withoutIndex = <T>(items: readonly T[], index: number): T[] =>
  index < 0 ? [...items] : items.filter((_, at) => at !== index);
