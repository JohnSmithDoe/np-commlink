import { IonColor } from '../../@shared/model/app.types';

export type BooleanKeys<T> = {
  [k in keyof T]: T[k] extends boolean ? k : never;
}[keyof T];

export interface ListSettings {
  showQuickAdd: boolean;
  showQuickAddProduct: boolean;
  showProductsInStorage: boolean;
  showShoppingInStorage: boolean;
  showProductsInShopping: boolean;
  showStorageInShopping: boolean;
  showStorageInProducts: boolean;
  showShoppingInProducts: boolean;
}

export type QuickAddState = Readonly<{
  listName?: string;
  color?: IonColor;
  searchQuery?: string;
  canAddLocal?: boolean;
  canAddProduct?: boolean;
}>;
