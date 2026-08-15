import { Injectable, signal } from '@angular/core';
import { BaseCategoryListPageFacade } from '../../@shared/data/categories/category-list-page.facade.base';
import { itemListCommands } from '../../@shared/data/item-lists/list-page.facade.base';
import { TASK_CATEGORIES_LIST_ID } from '../model/task.types';
import { TaskCategoriesActions } from './tasks.actions';
import {
  selectTaskCategoriesListItems,
  selectTaskCategoriesSearchResult,
  selectTaskCategoryList,
  selectTaskCountByCategory,
} from './tasks.selector';

@Injectable({ providedIn: 'root' })
export class TaskCategoriesPageFacade extends BaseCategoryListPageFacade {
  readonly catalogListId = TASK_CATEGORIES_LIST_ID;
  protected readonly actions = TaskCategoriesActions;

  protected readonly commands = itemListCommands(this.store, {
    updateSearch: TaskCategoriesActions.updateSearch,
    updateSort: TaskCategoriesActions.updateSort,
    addItemFromSearch: TaskCategoriesActions.addItemFromSearch,
  });

  readonly state = this.store.selectSignal(selectTaskCategoryList);
  readonly items = this.store.selectSignal(selectTaskCategoriesListItems);
  readonly searchResult = this.store.selectSignal(
    selectTaskCategoriesSearchResult
  );
  readonly countById = this.store.selectSignal(selectTaskCountByCategory);
  readonly listHref = signal('/tasks/list');
}
