import {
  clearSearchAfter,
  createItemListEffects,
} from '../../@shared/data/item-lists/item-list.effects.factory';
import { createCategory } from '../../@shared/util/app.factory';
import { createTaskItem } from '../util/task.factory';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';
import { selectTaskCategoryList, selectTasksList } from './tasks.selector';

/**
 * Tasks' item flow, composed from the shared single-list builders. Reads only
 * `state.tasks` and dispatches only `TasksActions`, which is what seals the
 * domain off the grocery engine — it depends on nothing in `groceries/`.
 *
 * NB: tasks has NO quick-add. The grocery quick-add row + slice moved into the
 * groceries domain in the settings re-scope, and tasks' vestigial copy was
 * removed: its only affordance ("add the typed search as a task") is already
 * covered by the searchbar's enter key and the empty state, and it was gated by
 * a grocery feature flag that has nothing to do with tasks.
 */
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

/**
 * The catalog's flow, from the SAME builders as the task list's — which is the
 * point of a catalog being a list. It gets add-from-search, add-or-update
 * resolution and the rename/search sync for free, where the manage page had
 * hand-written equivalents.
 *
 * A second call of the builder rather than a shared registration: NgRx dedups
 * same-class effect instances, so each call has to produce its own identities
 * (the reason these are functional objects and not an `@Injectable` class).
 */
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
