import dayjs from 'dayjs';
import { mockTaskItem } from '../testing/tasks.test-data';
import { dueStatusColor } from './task.utils';

const NOW = dayjs('2026-07-26T12:00:00.000Z');

const colorOf = (dueAt?: string) =>
  dueStatusColor(mockTaskItem({ dueAt }), NOW);

describe('dueStatusColor', () => {
  it('treats a task without a due date as unpressing', () => {
    expect(colorOf(undefined)).toBe('success');
  });

  it('flags an overdue task', () => {
    expect(colorOf(NOW.subtract(1, 'minute').toISOString())).toBe('danger');
  });

  it('flags the next three days as due soon', () => {
    expect(colorOf(NOW.toISOString())).toBe('warning');
    expect(
      colorOf(NOW.add(3, 'days').subtract(1, 'minute').toISOString())
    ).toBe('warning');
  });

  it('leaves anything three days out or later unpressing', () => {
    expect(colorOf(NOW.add(3, 'days').toISOString())).toBe('success');
    expect(colorOf(NOW.add(1, 'year').toISOString())).toBe('success');
  });
});
