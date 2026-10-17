import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { TodayService } from '../../@shared/data/services/today.service';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { mockTaskItem, mockTasksState } from '../testing/tasks.test-data';
import { TasksActions } from './tasks.actions';
import { reopenDueTasksResolver } from './reopen-due-tasks.resolver';

const weekly = mockTaskItem({
  id: 'weekly',
  interval: { unit: 'week', every: 1 },
  doneAt: '2026-10-10T08:00:00.000Z',
  nextDueAt: '2026-10-17',
});
const oneOff = mockTaskItem({
  id: 'one-off',
  doneAt: '2026-10-10T08:00:00.000Z',
});

const state = mockTasksState({ list: { items: [weekly, oneOff] } });

const runResolver = (): Observable<boolean> => {
  return reopenDueTasksResolver(
    {} as never,
    {} as never
  ) as Observable<boolean>;
};

const resolve = async (day: string) => {
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({ tasks: state }),
      { provide: TodayService, useValue: { today: signal(day) } },
    ],
  });
  const dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
  const isResolved = await firstValueFrom(
    TestBed.runInInjectionContext(runResolver)
  );
  return { dispatch, isResolved };
};

describe('reopenDueTasksResolver', () => {
  it('reopens the tasks whose window has opened before the list paints', async () => {
    const { dispatch, isResolved } = await resolve('2026-10-17');

    expect(dispatch.mock.calls).toEqual([[TasksActions.reopenDue([weekly])]]);
    expect(isResolved).toBe(true);
  });

  it('dispatches nothing while no window has opened', async () => {
    const { dispatch, isResolved } = await resolve('2026-10-16');

    expect(dispatch).not.toHaveBeenCalled();
    expect(isResolved).toBe(true);
  });
});
