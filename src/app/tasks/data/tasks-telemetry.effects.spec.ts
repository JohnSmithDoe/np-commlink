import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DashboardActions } from '../../@shared/util/dashboard/dashboard.actions';
import {
  mockAppState,
  mockTaskItem,
  mockTasksState,
} from '../../@shared/testing/test-data';
import { IAppState } from '../../@shared/types';
import {
  selectOpenTaskCount,
  TasksTelemetryEffects,
} from './tasks-telemetry.effects';

describe('TasksTelemetryEffects', () => {
  let effects: TasksTelemetryEffects;

  const setup = (state: Partial<IAppState> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        TasksTelemetryEffects,
        provideMockActions(() => of() as Observable<Action>),
        provideMockStore({ initialState: mockAppState(state) }),
      ],
    });
    effects = TestBed.inject(TasksTelemetryEffects);
  };

  it('reports the open-task count to the dashboard read-model', async () => {
    setup({
      tasks: mockTasksState({
        items: [mockTaskItem({ id: 'a' }), mockTaskItem({ id: 'b' })],
      }),
    });

    expect(await firstValueFrom(effects.report$)).toEqual(
      DashboardActions.report({ source: 'tasks', metrics: { open: 2 } })
    );
  });

  describe('selectOpenTaskCount', () => {
    it('is 0 for an unregistered slice', () => {
      expect(selectOpenTaskCount.projector(undefined as never)).toBe(0);
    });
  });
});
