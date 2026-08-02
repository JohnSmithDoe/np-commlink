import { Injectable, signal } from '@angular/core';
import { BaseCategoryListPageFacade } from '../../@shared/data/categories/category-list-page.facade.base';
import { TASK_CATEGORIES_LIST_ID } from '../model/task.types';
import { TaskCategoriesActions } from './tasks.actions';
import {
  selectTaskCategoriesListItems,
  selectTaskCategoriesSearchResult,
  selectTaskCategoryList,
  selectTaskCountByCategory,
  selectTasksCategories,
} from './tasks.selector';

@Injectable({ providedIn: 'root' })
export class TaskCategoriesPageFacade extends BaseCategoryListPageFacade {
  readonly catalogListId = TASK_CATEGORIES_LIST_ID;
  protected readonly actions = TaskCategoriesActions;

  readonly state = this.store.selectSignal(selectTaskCategoryList);
  readonly items = this.store.selectSignal(selectTaskCategoriesListItems);
  readonly searchResult = this.store.selectSignal(
    selectTaskCategoriesSearchResult
  );
  readonly categories = this.store.selectSignal(selectTasksCategories);
  readonly countById = this.store.selectSignal(selectTaskCountByCategory);
  readonly listHref = signal('/tasks/list');
}
