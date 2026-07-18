import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockAppState } from '../../@shared/testing/test-data';
import { mockTrackingState } from '../testing/tracking.test-data';
import { ItemDialogsActions } from '../../@shared/data/item-dialogs/item-dialogs.actions';
import { TrackingActions } from './tracking.actions';
import { TrackingItemDialogsEffects } from './tracking-item-dialogs.effects';

describe('TrackingItemDialogsEffects', () => {
  let actions$: Observable<Action>;
  let effects: TrackingItemDialogsEffects;

  const setup = (state = mockAppState()) => {
    TestBed.configureTestingModule({
      providers: [
        TrackingItemDialogsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: state }),
      ],
    });
    effects = TestBed.inject(TrackingItemDialogsEffects);
  };

  it('showCreateDialogWithSearch$ opens a create dialog seeded from the search term', async () => {
    setup(
      mockAppState({
        tracking: mockTrackingState({ searchQuery: 'Deep work' }),
      })
    );
    actions$ = of(ItemDialogsActions.showCreateDialogWithSearch('_tracking'));
    const action = (await firstValueFrom(
      effects.showCreateDialogWithSearch$
    )) as ReturnType<typeof ItemDialogsActions.showEditDialog>;
    expect(action.type).toBe(ItemDialogsActions.showEditDialog.type);
    expect(action.listId).toBe('_tracking');
    expect(action.item.name).toBe('Deep work');
  });

  // Both orchestrators stay registered once every route set is visited, so
  // tracking MUST ignore a grocery dialog (else it opens the tracking dialog).
  it('showCreateDialogWithSearch$ ignores a grocery listId', () => {
    setup();
    actions$ = of(ItemDialogsActions.showCreateDialogWithSearch('_storage'));
    const out: Action[] = [];
    effects.showCreateDialogWithSearch$.subscribe((a) => out.push(a));
    expect(out).toEqual([]);
  });

  it('showCreateByTicket$ opens a create dialog seeded with a fresh ticket', async () => {
    setup();
    actions$ = of(TrackingActions.showCreateByTicket());
    const action = (await firstValueFrom(
      effects.showCreateByTicket$
    )) as ReturnType<typeof ItemDialogsActions.showEditDialog>;
    expect(action.type).toBe(ItemDialogsActions.showEditDialog.type);
    expect(action.listId).toBe('_tracking');
    expect(action.item.name).toBe('new ticket');
  });
});
