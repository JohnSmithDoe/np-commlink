import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subscription } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { mockKernelState } from '../../@shared/testing/test-data';
import { TrackplayDeleted } from '../model/trackplay.types';
import { mockTrackplayState } from '../testing/trackplay.test-data';
import { TrackplayActions } from './trackplay.actions';
import { TrackplayEffects } from './trackplay.effects';

type ToastAction = ReturnType<typeof NotificationsActions.toast>;

const stashedDelete = (name: string): TrackplayDeleted => {
  const { players, games, gameTypes } = mockTrackplayState();
  return {
    name,
    snapshot: {
      players: players.items,
      games: games.items,
      gameTypes: gameTypes.items,
    },
  };
};

const settle = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

describe('TrackplayEffects', () => {
  let effects: TrackplayEffects;
  let store: MockStore;
  let subscription: Subscription;
  let emitted: ToastAction[];

  const stash = (lastDeleted: TrackplayDeleted | null): void =>
    store.setState(
      mockKernelState({ trackplay: mockTrackplayState({ lastDeleted }) })
    );

  const setup = () => {
    emitted = [];
    TestBed.configureTestingModule({
      providers: [
        TrackplayEffects,
        provideMockStore({
          initialState: mockKernelState({ trackplay: mockTrackplayState() }),
        }),
      ],
    });
    store = TestBed.inject(MockStore);
    effects = TestBed.inject(TrackplayEffects);
    subscription = effects.undoDeleteToast$.subscribe((action: Action) =>
      emitted.push(action as ToastAction)
    );
  };

  afterEach(() => subscription.unsubscribe());

  it('offers undo for the entity the reducer stashed', async () => {
    setup();

    stash(stashedDelete('Alice'));
    await settle();

    expect(emitted).toHaveLength(1);
    expect(emitted[0].message).toEqual(
      expect.objectContaining({
        key: 'trackplay.toast.undo-delete',
        parameters: { name: 'Alice' },
        group: 'trackplay-undo',
      })
    );
  });

  it('carries restoreLastDeleted as the offered action', async () => {
    setup();

    stash(stashedDelete('Alice'));
    await settle();

    expect(emitted[0].message.action).toEqual({
      labelKey: 'trackplay.toast.undo',
      action: TrackplayActions.restoreLastDeleted(),
    });
  });

  it('groups its toasts, so the shared effect supersedes the previous one', async () => {
    setup();

    stash(stashedDelete('Skat'));
    stash(stashedDelete('Rommé'));
    await settle();

    expect(emitted.map((toast) => toast.message.group)).toEqual([
      'trackplay-undo',
      'trackplay-undo',
    ]);
    expect(emitted[1].message.parameters).toEqual({ name: 'Rommé' });
  });

  it('stays quiet when a refused delete leaves the stash untouched', async () => {
    setup();
    const stashed = stashedDelete('Alice');

    stash(stashed);
    stash(stashed);
    await settle();

    expect(emitted).toHaveLength(1);
  });

  it('stays silent while nothing is stashed', async () => {
    setup();

    stash(null);
    await settle();

    expect(emitted).toHaveLength(0);
  });

  it('offers undo again after the previous snapshot was restored', async () => {
    setup();

    stash(stashedDelete('Alice'));
    stash(null);
    stash(stashedDelete('Bob'));
    await settle();

    expect(emitted).toHaveLength(2);
    expect(emitted[1].message.parameters).toEqual({ name: 'Bob' });
  });
});
