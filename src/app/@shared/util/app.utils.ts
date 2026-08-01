import {
  InputCustomEvent,
  ReorderEndCustomEvent,
} from '@ionic/angular/standalone';
import { TIonDragEvent } from '../model/app.types';
import { IBaseItem } from '../model/base-item.types';

export const uuidv4 = () => crypto.randomUUID();

const SWIPE_TRIGGER_AMOUNT = 160;

// Which side of a sliding item the drag pulled far enough to reveal, or
// undefined if it fell short of the trigger distance.
export const revealedSideFromDrag = (
  event: TIonDragEvent
): 'start' | 'end' | undefined => {
  if (event.detail.amount > SWIPE_TRIGGER_AMOUNT) return 'end';
  if (event.detail.amount < -SWIPE_TRIGGER_AMOUNT) return 'start';
  return undefined;
};

export const matchingTxt = (item: IBaseItem | string) =>
  (typeof item === 'string' ? item : item.name).trim().toLowerCase();

export const matchingTxtIsNotEmpty = (item?: IBaseItem | string) =>
  matchingTxt(item ?? '').length > 0;

export const matchesNameExactly = (item: IBaseItem, other: IBaseItem) =>
  matchingTxt(item) === matchingTxt(other);

export const matchesId = (item: IBaseItem, other: IBaseItem) =>
  item.id === other.id;

export function matchesItemExactly<T extends IBaseItem>(item: T, others: T[]) {
  const byId = others.find((other) => matchesId(item, other));
  return byId || others.find((other) => matchesNameExactly(item, other));
}

export const matchesItemExactlyIndex = (
  item: IBaseItem,
  others: IBaseItem[]
) => {
  const found = matchesItemExactly(item, others);
  return found ? others.indexOf(found) : -1;
};

export const matchesSearch = (item: IBaseItem | string, searchQuery?: string) =>
  matchingTxt(item).includes(matchingTxt(searchQuery ?? ''));

/**
 * `matchesSearch` with the query normalized once instead of once per candidate.
 * The two-argument form re-trims and re-lowercases the needle for every item it
 * is asked about, which is thousands of throwaway strings per keystroke on the
 * list surfaces — build the matcher outside the loop and the query is normalized
 * exactly once per filter pass.
 */
export const matcherFor = (searchQuery?: string) => {
  const needle = matchingTxt(searchQuery ?? '');
  return (item: IBaseItem | string) => matchingTxt(item).includes(needle);
};

export const matchesSearchExactly = (
  item: IBaseItem | string,
  searchQuery?: string
) => matchingTxt(item) === matchingTxt(searchQuery ?? '');

export function parseNumberInput(event: InputCustomEvent) {
  const value = event.detail.value?.length ? event.detail.value : '0';
  return Number.parseInt(value, 10);
}

/**
 * A list with one entry moved, as an `ionReorderEnd` describes the drop. Shared
 * because two domains reorder by drag now (the deck's programs, the cash rules),
 * and both persist the *complete* resulting order rather than an index.
 */
export function moveInList<T>(
  list: readonly T[],
  from: number,
  to: number
): T[] {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

/**
 * The id order a drop produces, and the `complete(false)` that has to accompany
 * it: Angular re-renders the list from the stored order, so letting Ionic move
 * the node as well would apply the drop twice.
 *
 * That call is the reason this exists rather than each page composing
 * `moveInList` itself. Extracting only the pure half left the trap duplicated —
 * both call sites carried the same two lines and the same paragraph explaining
 * them, which is the shape of a rule kept by memory. The result is the
 * COMPLETE order, because both reducers rebuild their list from these ids and
 * an omitted one is a deletion.
 */
export function reorderedIds<T extends { id: string }>(
  event: ReorderEndCustomEvent,
  items: readonly T[]
): string[] {
  const { from, to } = event.detail;
  event.detail.complete(false);
  return moveInList(
    items.map((item) => item.id),
    from,
    to
  );
}
