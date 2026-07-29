import { ITaskItem, ITasksState } from '../model/task.types';
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

export function mockTasksState(
  overrides: Partial<ITasksState> = {}
): ITasksState {
  return {
    id: '_tasks',
    items: [],
    categories: [],
    mode: 'alphabetical',
    ...overrides,
  };
}
