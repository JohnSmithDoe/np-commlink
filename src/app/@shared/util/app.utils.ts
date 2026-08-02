import {
  InputCustomEvent,
  ReorderEndCustomEvent,
} from '@ionic/angular/standalone';
import { IonDragEvent } from '../model/app.types';
import { BaseItem } from '../model/base-item.types';

export const uuidv4 = () => crypto.randomUUID();

const SWIPE_TRIGGER_AMOUNT = 160;

export const revealedSideFromDrag = (
  event: IonDragEvent
): 'start' | 'end' | undefined => {
  if (event.detail.amount > SWIPE_TRIGGER_AMOUNT) return 'end';
  if (event.detail.amount < -SWIPE_TRIGGER_AMOUNT) return 'start';
  return undefined;
};

export const matchingTxt = (item: BaseItem | string) =>
  (typeof item === 'string' ? item : item.name).trim().toLowerCase();

export const matchingTxtIsNotEmpty = (item?: BaseItem | string) =>
  matchingTxt(item ?? '').length > 0;

export const matchesNameExactly = (item: BaseItem, other: BaseItem) =>
  matchingTxt(item) === matchingTxt(other);

export const matchesId = (item: BaseItem, other: BaseItem) =>
  item.id === other.id;

export function matchesItemExactly<T extends BaseItem>(item: T, others: T[]) {
  const byId = others.find((other) => matchesId(item, other));
  return byId || others.find((other) => matchesNameExactly(item, other));
}

export const matchesItemExactlyIndex = (item: BaseItem, others: BaseItem[]) => {
  const found = matchesItemExactly(item, others);
  return found ? others.indexOf(found) : -1;
};

export const matchesSearch = (item: BaseItem | string, searchQuery?: string) =>
  matchingTxt(item).includes(matchingTxt(searchQuery ?? ''));

export const matcherFor = (searchQuery?: string) => {
  const needle = matchingTxt(searchQuery ?? '');
  return (item: BaseItem | string) => matchingTxt(item).includes(needle);
};

export const matchesSearchExactly = (
  item: BaseItem | string,
  searchQuery?: string
) => matchingTxt(item) === matchingTxt(searchQuery ?? '');

export function parseNumberInput(event: InputCustomEvent) {
  const value = event.detail.value?.length ? event.detail.value : '0';
  return Number.parseInt(value, 10);
}

export function moveInList<T>(
  list: readonly T[],
  from: number,
  to: number
): T[] {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

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
