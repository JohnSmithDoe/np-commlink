import {
  clearSearchAfter,
  createItemListEffects,
} from '../../@shared/data/item-lists/item-list.effects.factory';
import {
  categoryFilterFromRoute,
  clearCategoryFilterIn,
} from '../../@shared/data/item-lists/category-filter.effects';
import { selectRouteCategoryFilter } from '../../@shared/data/router/router.selector';
import { createCategory } from '../../@shared/util/app.factory';
import { createTaskItem } from '../util/task.factory';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import { selectTaskCategoryList, selectTasksList } from './tasks.selector';

export const tasksRouteFilterEffects = {
  drilledFilter$: categoryFilterFromRoute(selectRouteCategoryFilter, (id) =>
    id ? TasksActions.updateFilter(id) : undefined
  ),

  clearFilter$: clearCategoryFilterIn(() =>
    TasksActions.updateFilter(undefined)
  ),
};

export const tasksListEffects = {
  ...createItemListEffects({
    actions: TasksActions,
    select: selectTasksList,
    create: (name, filterBy) => createTaskItem(name, filterBy),
  }),

  clearSearch$: clearSearchAfter(TasksActions.updateSearch, [
    TasksActions.addItem,
    TasksActions.updateFilter,
  ]),
};

export const taskCategoriesListEffects = {
  ...createItemListEffects({
    actions: TaskCategoriesActions,
    select: selectTaskCategoryList,
    create: (name) => createCategory(name),
  }),

  clearSearch$: clearSearchAfter(TaskCategoriesActions.updateSearch, [
    TaskCategoriesActions.addItem,
    TaskCategoriesActions.removeItem,
  ]),
};
