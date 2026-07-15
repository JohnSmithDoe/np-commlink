import { AbstractControl } from '@angular/forms';
import { InputCustomEvent } from '@ionic/angular';
import {
  IBaseItem,
  IProduct,
  IShoppingItem,
  IStorageItem,
  ITaskItem,
  TAllItemTypes,
  TIonDragEvent,
} from '../types';

export const uuidv4 = () => crypto.randomUUID();

// --- grocery item type guards (from kitchen-bot) ---
export const isProductItem = (value: TAllItemTypes): value is IProduct =>
  Object.prototype.hasOwnProperty.call(value, 'unit');
export const isStorageItem = (value?: TAllItemTypes): value is IStorageItem =>
  !!value && Object.prototype.hasOwnProperty.call(value, 'bestBefore');
export const isTaskItem = (value?: TAllItemTypes): value is ITaskItem =>
  !!value && Object.prototype.hasOwnProperty.call(value, 'prio');
export const isShoppingItem = (value?: TAllItemTypes): value is IShoppingItem =>
  !!value && Object.prototype.hasOwnProperty.call(value, 'state');

export const hasQuantity = (
  value?: unknown
): value is { quantity: number; name: string } =>
  !!value &&
  Object.prototype.hasOwnProperty.call(value, 'quantity') &&
  Object.prototype.hasOwnProperty.call(value, 'name');

// handle the dragging from the list items
export const checkItemOptionsOnDrag = (
  ev: TIonDragEvent,
  triggerAmount = 160
) =>
  ev.detail.amount > triggerAmount
    ? 'end'
    : ev.detail.amount < -triggerAmount
      ? 'start'
      : false;

export const matchingTxt = (item: IBaseItem | string) =>
  (typeof item === 'string' ? item : item.name).trim().toLowerCase();

export const matchingTxtIsNotEmpty = (item?: IBaseItem | string) =>
  !!matchingTxt(item ?? '').length;

export const matchingTxtIsEmpty = (item?: IBaseItem | string) =>
  !matchingTxt(item ?? '').length;

export const matchesSearchString = (value: string, searchQuery?: string) =>
  matchingTxt(value).includes(matchingTxt(searchQuery ?? ''));

export const matchesCategory = (item: IBaseItem, searchQuery: string) =>
  !!item.category?.find((cat) => matchesSearchString(cat, searchQuery));

export const matchesCategoryExactly = (item: IBaseItem, searchQuery: string) =>
  !!item.category?.find((cat) => matchesSearchExactly(cat, searchQuery));

export const matchesNameExactly = (item: IBaseItem, other: IBaseItem) =>
  matchingTxt(item) === matchingTxt(other);

export const matchesId = (item: IBaseItem, other: IBaseItem) =>
  item.id === other.id;

export function matchesItemExactly<T extends IBaseItem>(item: T, others: T[]) {
  // by id first if not found try by name
  const byId = others.find((other) => matchesId(item, other));
  return byId || others.find((other) => matchesNameExactly(item, other));
}

export const matchesItemExactlyIdx = (item: IBaseItem, others: IBaseItem[]) => {
  const found = matchesItemExactly(item, others);
  return others.findIndex((other) => other === found);
};

export const matchesSearch = (item: IBaseItem | string, searchQuery: string) =>
  matchingTxt(item).includes(matchingTxt(searchQuery));

export const matchesSearchExactly = (
  item: IBaseItem | string,
  searchQuery?: string
) => matchingTxt(item) === matchingTxt(searchQuery ?? '');

export function parseNumberInput(ev: InputCustomEvent) {
  const value = ev.detail.value?.length ? ev.detail.value : '0';
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
