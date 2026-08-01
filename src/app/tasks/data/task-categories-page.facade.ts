import { inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
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

/**
 * The tasks catalog page. Everything a catalog page does is the shared base's;
 * this supplies the reads, the action group and where a drill lands.
 *
 * It dispatches only `TaskCategoriesActions`, never the task list's own, which is
 * what keeps a search typed here from clearing the task list's query.
 */
@Injectable({ providedIn: 'root' })
export class TaskCategoriesPageFacade extends BaseCategoryListPageFacade {
  readonly #store = inject(Store);

  readonly catalogListId = TASK_CATEGORIES_LIST_ID;
  protected readonly actions = TaskCategoriesActions;

  readonly state = this.#store.selectSignal(selectTaskCategoryList);
  readonly items = this.#store.selectSignal(selectTaskCategoriesListItems);
  readonly searchResult = this.#store.selectSignal(
    selectTaskCategoriesSearchResult
  );
  readonly categories = this.#store.selectSignal(selectTasksCategories);
  readonly countById = this.#store.selectSignal(selectTaskCountByCategory);
  readonly listHref = signal('/tasks/list');
}
