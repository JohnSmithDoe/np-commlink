import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TodayService } from '../../@shared/data/services/today.service';
import { mockKernelState } from '../../@shared/testing/test-data';
import { mockTaskItem, mockTasksState } from '../testing/tasks.test-data';
import { TasksActions } from './tasks.actions';
import { tasksDayRolloverEffects } from './tasks-day-rollover.effects';

const weekly = mockTaskItem({
  id: 'weekly',
  interval: { unit: 'week', every: 1 },
  doneAt: '2026-10-10T08:00:00.000Z',
  nextDueAt: '2026-10-17',
});
const later = mockTaskItem({
  id: 'later',
  interval: { unit: 'week', every: 1 },
  doneAt: '2026-10-10T08:00:00.000Z',
  nextDueAt: '2026-10-24',
});

const state = mockKernelState({
  tasks: mockTasksState({ list: { items: [weekly, later] } }),
});

const run = (startDay: string) => {
  const today = signal(startDay);
  TestBed.configureTestingModule({
    providers: [
      provideMockStore({ initialState: state }),
      { provide: TodayService, useValue: { today } },
    ],
  });
  const emitted: Action[] = [];
  TestBed.runInInjectionContext(
    tasksDayRolloverEffects.reopenOnDayChange$
  ).subscribe((action) => {
    emitted.push(action);
  });
  TestBed.tick();
  return { today, emitted };
};

describe('tasksDayRolloverEffects.reopenOnDayChange$', () => {
  it('reopens what came due when the day rolls over', () => {
    const { today, emitted } = run('2026-10-16');

    today.set('2026-10-17');
    TestBed.tick();

    expect(emitted).toEqual([TasksActions.reopenDue([weekly])]);
  });

  it('leaves the day it started on to the resolver', () => {
    const { emitted } = run('2026-10-17');

    expect(emitted).toEqual([]);
  });

  it('stays quiet when the new day reopens nothing', () => {
    const { today, emitted } = run('2026-10-15');

    today.set('2026-10-16');
    TestBed.tick();

    expect(emitted).toEqual([]);
  });
});
