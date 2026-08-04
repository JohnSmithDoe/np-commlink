import { InjectionToken, Provider, signal, Signal, Type } from '@angular/core';
import { Category, CategoryId } from '../../model/category.types';
import { ItemListId } from '../../model/item-list.types';
import { ListPageFacade, LIST_FACADE } from '../item-lists/list-page.facade';

export interface CategoryListPageFacade extends ListPageFacade {
  readonly catalogListId: ItemListId;
  readonly categories: Signal<readonly Category[]>;
  readonly countById: Signal<Map<CategoryId, number>>;
  readonly listHref: Signal<string>;

  saveCategory(category: Category): void;
  removeCategory(category: Category): void;
  showEditDialog(category: Category): void;
  drillTo(id: CategoryId): void;
}

export const CATEGORY_LIST_FACADE = new InjectionToken<CategoryListPageFacade>(
  'CATEGORY_LIST_FACADE'
);

export const provideCategoryListFacade = (
  facade: Type<CategoryListPageFacade>
): Provider[] => [
  { provide: LIST_FACADE, useExisting: facade },
  { provide: CATEGORY_LIST_FACADE, useExisting: facade },
];

export const NO_CATALOG: Signal<readonly Category[]> = signal<
  readonly Category[]
>([]).asReadonly();
