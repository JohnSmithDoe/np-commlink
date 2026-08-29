import { Injectable, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BaseCategoryListPageFacade } from '../../@shared/data/categories/category-list-page.facade.base';
import { itemListCommands } from '../../@shared/data/item-lists/list-page.facade.base';
import { Category } from '../../@shared/model/category.types';
import { DispatchableAction } from '../../@shared/model/dispatchable-action.types';
import { TASK_CATEGORIES_LIST_ID } from '../model/task.types';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import {
  selectTaskCategoriesListItems,
  selectTaskCategoriesSearchResult,
  selectTaskCategoryList,
  selectTaskCountByCategory,
  selectTaskTaggedByCategory,
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
  readonly undoScope = signal(TASK_CATEGORIES_LIST_ID);

  readonly #taggedWith = this.store.selectSignal(selectTaskTaggedByCategory);
  readonly listHref = signal('/tasks/list');
  readonly listTitleKey = signal(marker('page-title.tasks'));

  protected override restoreActionFor(category: Category): DispatchableAction {
    return TasksActions.restoreCategory(
      category,
      this.#taggedWith()(category.id)
    );
  }
}
