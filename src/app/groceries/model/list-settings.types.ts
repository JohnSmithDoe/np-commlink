import { TColor } from '../../@shared/model/app.types';

// Grocery list feature-flags (kitchen-bot `ISettings`; an aggregate of the
// `groceries` slice). They were parked in @shared as a pseudo-shared "list
// settings" slice, but they're grocery-only: the showQuickAdd* toggles gate the
// grocery quick-add row and the show*In* flags gate the cross-list search
// buckets. The persisted schema `version` that used to ride here moved to the
// app-global settings slice.

// Keys of T whose value is boolean — the feature-flag toggles the
// list-settings action/facade/page speak. Lives here because listSettings is the
// only consumer.
export type BooleanKeys<T> = {
  [k in keyof T]: T[k] extends boolean ? k : never;
}[keyof T];

export interface IListSettings {
  showQuickAdd: boolean;
  showQuickAddProduct: boolean;
  showProductsInStorage: boolean;
  showShoppingInStorage: boolean;
  showProductsInShopping: boolean;
  showStorageInShopping: boolean;
  showStorageInProducts: boolean;
  showShoppingInProducts: boolean;
}

// The grocery quick-add row's derived UI state — the one aggregate that is NOT
// part of the persisted slice: the engine recomputes it (updateQuickAddState) on
// search changes, and the quick-add component reads it ANDed with the
// showQuickAdd* flags above.
export type IQuickAddState = Readonly<{
  listName?: string;
  color?: TColor;
  searchQuery?: string;
  canAddLocal?: boolean;
  canAddProduct?: boolean;
}>;
