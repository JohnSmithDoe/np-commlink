import { AbstractControl } from '@angular/forms';
import { InputCustomEvent } from '@ionic/angular/standalone';
import { TIonDragEvent } from '../model/app.types';
import { IBaseItem } from '../model/base-item.types';
import { TCategoryId } from '../model/category.types';

export const uuidv4 = () => crypto.randomUUID();

// Which side of a sliding item the drag pulled far enough to reveal, or
// undefined if it fell short of the trigger distance.
export const revealedSideFromDrag = (
  event: TIonDragEvent,
  triggerAmount = 160
): 'start' | 'end' | undefined =>
  event.detail.amount > triggerAmount
    ? 'end'
    : event.detail.amount < -triggerAmount
      ? 'start'
      : undefined;

export const matchingTxt = (item: IBaseItem | string) =>
  (typeof item === 'string' ? item : item.name).trim().toLowerCase();

export const matchingTxtIsNotEmpty = (item?: IBaseItem | string) =>
  matchingTxt(item ?? '').length > 0;

export const matchesSearchString = (value: string, searchQuery?: string) =>
  matchingTxt(value).includes(matchingTxt(searchQuery ?? ''));

// Categories are referenced by id now — an item "has" a category iff its
// `categoryIds` list contains that id. Name-based matching (search over category
// names) resolves ids→names against the list's catalog at the call site.
export const itemHasCategory = (item: IBaseItem, categoryId: TCategoryId) =>
  !!item.categoryIds?.includes(categoryId);

export const matchesNameExactly = (item: IBaseItem, other: IBaseItem) =>
  matchingTxt(item) === matchingTxt(other);

export const matchesId = (item: IBaseItem, other: IBaseItem) =>
  item.id === other.id;

export function matchesItemExactly<T extends IBaseItem>(item: T, others: T[]) {
  const byId = others.find((other) => matchesId(item, other));
  return byId || others.find((other) => matchesNameExactly(item, other));
}

export const matchesItemExactlyIdx = (item: IBaseItem, others: IBaseItem[]) => {
  const found = matchesItemExactly(item, others);
  return found ? others.indexOf(found) : -1;
};

export const matchesSearch = (item: IBaseItem | string, searchQuery: string) =>
  matchingTxt(item).includes(matchingTxt(searchQuery));

export const matchesSearchExactly = (
  item: IBaseItem | string,
  searchQuery?: string
) => matchingTxt(item) === matchingTxt(searchQuery ?? '');

export function parseNumberInput(event: InputCustomEvent) {
  const value = event.detail.value?.length ? event.detail.value : '0';
  return Number.parseInt(value, 10);
}

export function validateNameInput<T extends IBaseItem>(
  items?: T[],
  item?: T | null
) {
  return (control: AbstractControl) => {
    if (matchingTxt(control.value ?? '').length === 0) return { empty: true };
    const found = items?.filter((item) =>
      matchesSearchExactly(item, control.value)
    );
    if (!found || found.length === 0) return null;
    const hasDuplicates = found.length > 1 || found.pop()?.id !== item?.id;

    return hasDuplicates ? { duplicate: true } : null;
  };
}
