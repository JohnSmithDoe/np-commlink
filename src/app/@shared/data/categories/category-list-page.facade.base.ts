import { inject, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { Action, Store } from '@ngrx/store';
import { BaseItem } from '../../model/base-item.types';
import { Category, CategoryId } from '../../model/category.types';
import {
  SearchResult,
  ItemListId,
  ItemListSortType,
  ListState,
} from '../../model/item-list.types';
import {
  CategoryListPageFacade,
  NO_CATALOG,
} from '../../util/categories/category-list.facade';
import { openCategoryCreate, openCategoryEdit } from './category-dialogs';
import { ItemDialogService } from '../item-lists/item-dialog.service';
import { categoryFilterQueryParameters } from '../../util/item-lists/category-filter.route';

interface CategoryListActions {
  updateSearch: (searchQuery?: string) => Action;
  addItemFromSearch: () => Action;
  updateSort: (
    sortBy?: ItemListSortType,
    sortDirection?: 'asc' | 'desc' | 'keep' | 'toggle'
  ) => Action;
  addOrUpdateItem: (item: Category) => Action;
  removeItem: (item: Category) => Action;
}

export abstract class BaseCategoryListPageFacade implements CategoryListPageFacade {
  protected readonly store = inject(Store);
  readonly #router = inject(Router);
  readonly #dialogs = inject(ItemDialogService);

  abstract readonly catalogListId: ItemListId;
  protected abstract readonly actions: CategoryListActions;

  abstract readonly state: Signal<ListState<Category>>;
  abstract readonly items: Signal<BaseItem[] | undefined>;
  abstract readonly searchResult: Signal<SearchResult<BaseItem> | undefined>;
  abstract readonly categories: Signal<readonly Category[]>;
  abstract readonly countById: Signal<Map<CategoryId, number>>;
  abstract readonly listHref: Signal<string>;

  readonly catalog = NO_CATALOG;

  search(term?: string): void {
    this.store.dispatch(this.actions.updateSearch(term));
  }

  addItemFromSearch(): void {
    this.store.dispatch(this.actions.addItemFromSearch());
  }

  setSortMode(type: ItemListSortType): void {
    this.store.dispatch(this.actions.updateSort(type, 'toggle'));
  }

  selectCategory(): void {}

  showCreateDialog(): void {
    openCategoryCreate(
      this.#dialogs,
      this.catalogListId,
      this.state().searchQuery
    );
  }

  showEditDialog(category: Category): void {
    openCategoryEdit(this.#dialogs, this.catalogListId, category);
  }

  saveCategory(category: Category): void {
    this.store.dispatch(this.actions.addOrUpdateItem(category));
  }

  removeCategory(category: Category): void {
    this.store.dispatch(this.actions.removeItem(category));
  }

  drillTo(id: CategoryId): void {
    void this.#router.navigate([this.listHref()], {
      queryParams: categoryFilterQueryParameters(id),
    });
  }
}
