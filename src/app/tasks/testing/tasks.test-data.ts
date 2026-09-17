import { CategoryList } from '../../@shared/model/category.types';
import {
  TASK_CATEGORIES_LIST_ID,
  TaskItem,
  DEFAULT_TASK_SETTINGS,
  TaskSettings,
  TASKS_LIST_ID,
  TasksList,
  TasksState,
} from '../model/task.types';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';

export function mockTaskItem(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 'task-1',
    name: 'Clean the kitchen',
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

export function mockTasksList(overrides: Partial<TasksList> = {}): TasksList {
  return { id: TASKS_LIST_ID, items: [], ...overrides };
}

function mockTaskCategoryList(
  overrides: Partial<CategoryList> = {}
): CategoryList {
  return { id: TASK_CATEGORIES_LIST_ID, items: [], ...overrides };
}

export function mockTasksState(
  overrides: {
    list?: Partial<TasksList>;
    categoryList?: Partial<CategoryList>;
    settings?: Partial<TaskSettings>;
  } = {}
): TasksState {
  return {
    list: mockTasksList(overrides.list),
    categoryList: mockTaskCategoryList(overrides.categoryList),
    settings: { ...DEFAULT_TASK_SETTINGS, ...overrides.settings },
  };
}
