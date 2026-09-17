import { DEFAULT_TASK_SETTINGS, TasksState } from '../model/task.types';
import { tasksV1ToV2 } from './tasks.migrations';

const V1 = {
  list: {
    id: '_tasks',
    items: [
      { id: 'a', name: 'Steuer', dueAt: '2026-03-01' },
      {
        id: 'b',
        name: 'Filter wechseln',
        doneAt: '2026-01-31T09:00:00.000Z',
        interval: { unit: 'month', every: 1 },
      },
      {
        id: 'c',
        name: 'Müll rausbringen',
        doneAt: '2026-07-20T18:00:00.000Z',
        interval: { unit: 'day', weekdays: [1, 4] },
      },
      { id: 'd', name: 'Passfoto', doneAt: '2026-02-02T08:00:00.000Z' },
    ],
  },
  categoryList: { id: '_task-categories', items: [{ id: 'k', name: 'Haus' }] },
};

const migrated = () => tasksV1ToV2(structuredClone(V1)) as TasksState;
const itemById = (id: string) =>
  migrated().list.items.find((item) => item.id === id);

describe('tasks v1 → v2', () => {
  it('writes down the next date v1 computed on every read', () => {
    expect(itemById('b')?.nextDueAt).toBe('2026-02-28');
    expect(itemById('c')?.nextDueAt).toBe('2026-07-23');
  });

  it('leaves an open task and its missing due date alone', () => {
    expect(itemById('a')).toEqual({
      id: 'a',
      name: 'Steuer',
      dueAt: '2026-03-01',
      nextDueAt: '2026-03-01',
    });
  });

  it('seeds the log with the one close v1 knew about', () => {
    expect(itemById('d')?.closings).toEqual([{ on: '2026-02-02' }]);
    expect(itemById('b')?.closings).toEqual([{ on: '2026-01-31' }]);
  });

  it('adds the settings the slice had no room for', () => {
    expect(migrated().settings).toEqual(DEFAULT_TASK_SETTINGS);
  });

  it('carries the category catalog across untouched', () => {
    expect(migrated().categoryList).toEqual(V1.categoryList);
  });

  it('survives a document with no list at all', () => {
    const empty = tasksV1ToV2({}) as TasksState;
    expect(empty.list.items).toEqual([]);
    expect(empty.settings).toEqual(DEFAULT_TASK_SETTINGS);
  });
});
