import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockKernelState, MockState } from '../../@shared/testing/test-data';
import { mockTasksState } from '../testing/tasks.test-data';
import { TasksActions } from './tasks.actions';
import { tasksListEffects } from './tasks-list.effects';

describe('tasksListEffects', () => {
  let actions$: Observable<Action>;

  const setup = (state: MockState = {}) => {
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockKernelState(state) }),
      ],
    });
  };

  const run = <T>(effect: () => Observable<T>): Observable<T> =>
    TestBed.runInInjectionContext(() => effect());

  it('addItemFromSearch$ seeds the new-task defaults from the settings', async () => {
    setup({
      tasks: mockTasksState({
        list: { searchQuery: 'Call', items: [] },
        settings: { defaultAnchor: 'due' },
      }),
    });
    actions$ = of(TasksActions.addItemFromSearch());

    const emitted = await firstValueFrom(
      run(tasksListEffects.addItemFromSearch$)
    );

    expect(emitted).toEqual(
      TasksActions.addItem(
        expect.objectContaining({ name: 'Call', anchor: 'due' }) as never
      )
    );
  });
});
