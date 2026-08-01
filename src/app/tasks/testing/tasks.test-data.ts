import { ICategoryList } from '../../@shared/model/category.types';
import {
  ITaskItem,
  ITasksState,
  TASK_CATEGORIES_LIST_ID,
  TASKS_LIST_ID,
  TTasksList,
} from '../model/task.types';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';

// Deterministic task fixtures (type:testing), moved out of the shared
// test-data god-file so `@shared/testing` no longer imports a domain type
// (DDD review #1). Stable ids/timestamps keep equality assertions repeatable.

export function mockTaskItem(overrides: Partial<ITaskItem> = {}): ITaskItem {
  return {
    id: 'task-1',
    name: 'Clean the kitchen',
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

export function mockTasksList(overrides: Partial<TTasksList> = {}): TTasksList {
  return { id: TASKS_LIST_ID, items: [], ...overrides };
}

function mockTaskCategoryList(
  overrides: Partial<ICategoryList> = {}
): ICategoryList {
  return { id: TASK_CATEGORIES_LIST_ID, items: [], ...overrides };
}

// Seeds either half by name, so a spec that only cares about tasks does not have
// to spell out an empty catalog (and vice versa).
export function mockTasksState(
  overrides: {
    list?: Partial<TTasksList>;
    categoryList?: Partial<ICategoryList>;
  } = {}
): ITasksState {
  return {
    list: mockTasksList(overrides.list),
    categoryList: mockTaskCategoryList(overrides.categoryList),
  };
}
