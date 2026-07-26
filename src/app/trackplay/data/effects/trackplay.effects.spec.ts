import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of, Subject, toArray } from 'rxjs';
import { mockKernelState } from '../../../@shared/testing/test-data';
import { ITrackplayDeleted } from '../../model/trackplay.types';
import {
  mockGame,
  mockGameType,
  mockPlayer,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { TrackplayActions } from '../actions/trackplay.actions';
import { TrackplayEffects } from './trackplay.effects';

type TToastButton = { text?: string; role?: string; handler?: () => void };
type TPresentedToast = {
  header: string;
  message: string;
  buttons: TToastButton[];
};

// The effect only reads `name`, but the snapshot half is what the reducer
// actually stashes — build the real shape so the fixture can't drift from it.
const stashedDelete = (name: string): ITrackplayDeleted => {
  const { players, games, gameTypes, rounds } = mockTrackplayState();
  return { name, snapshot: { players, games, gameTypes, rounds } };
};

describe('TrackplayEffects', () => {
  let actions$: Observable<Action>;
  let effects: TrackplayEffects;
  let store: MockStore;
  let toast: {
    present: ReturnType<typeof vi.fn>;
    dismiss: ReturnType<typeof vi.fn>;
  };
  let toastController: {
    create: ReturnType<typeof vi.fn>;
    getTop: ReturnType<typeof vi.fn>;
    dismiss: ReturnType<typeof vi.fn>;
  };

  const setup = (lastDeleted: ITrackplayDeleted | null) => {
    toast = {
      present: vi.fn().mockResolvedValue(undefined),
      dismiss: vi.fn().mockResolvedValue(true),
    };
    toastController = {
      create: vi.fn().mockResolvedValue(toast),
      getTop: vi.fn().mockResolvedValue(undefined),
      dismiss: vi.fn().mockResolvedValue(true),
    };
    TestBed.configureTestingModule({
      providers: [
        TrackplayEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: mockKernelState({
            trackplay: mockTrackplayState({ lastDeleted }),
          }),
        }),
        { provide: ToastController, useValue: toastController },
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
      ],
    });
    store = TestBed.inject(MockStore);
    effects = TestBed.inject(TrackplayEffects);
  };

  const presentedToast = (index = 0): TPresentedToast =>
    toastController.create.mock.calls[index][0] as TPresentedToast;

  it('offers undo for the entity the reducer stashed', async () => {
    setup(stashedDelete('Alice'));
    actions$ = of(TrackplayActions.deletePlayer(mockPlayer()));

    await firstValueFrom(effects.undoDeleteToast$);
    await vi.waitFor(() => expect(toastController.create).toHaveBeenCalled());

    expect(presentedToast()).toEqual(
      expect.objectContaining({
        header: 'trackplay.toast.undo-delete',
        message: 'Alice',
      })
    );
    expect(toast.present).toHaveBeenCalledTimes(1);
  });

  it('restores the snapshot when the undo button is tapped', async () => {
    setup(stashedDelete('Alice'));
    actions$ = of(TrackplayActions.deletePlayer(mockPlayer()));
    const dispatch = vi.spyOn(store, 'dispatch');

    await firstValueFrom(effects.undoDeleteToast$);
    await vi.waitFor(() => expect(toastController.create).toHaveBeenCalled());
    const undo = presentedToast().buttons.find(
      (button) => button.text === 'trackplay.toast.undo'
    );
    undo?.handler?.();

    expect(undo).toBeDefined();
    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.restoreLastDeleted()
    );
  });

  /**
   * Single-level undo: a second delete must not leave a stale toast that would
   * restore the older snapshot. It dismisses *its own* toast rather than every
   * presented overlay — the controller sweep tore down other domains' toasts
   * and could spin forever on one already mid-leave-animation.
   *
   * Driven sequentially because that is the real flow: a second delete lands
   * after the first toast is already up.
   */
  it('dismisses its own still-open undo toast before presenting the next one', async () => {
    const deletes = new Subject<Action>();
    actions$ = deletes;
    setup(stashedDelete('Skat'));
    const subscription = effects.undoDeleteToast$.subscribe();

    deletes.next(TrackplayActions.deleteGameType(mockGameType()));
    await vi.waitFor(() => expect(toast.present).toHaveBeenCalledTimes(1));

    deletes.next(TrackplayActions.deleteGameType(mockGameType()));
    await vi.waitFor(() => expect(toast.present).toHaveBeenCalledTimes(2));

    expect(toast.dismiss).toHaveBeenCalledWith(null, 'cancel');
    expect(toastController.dismiss).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });

  it('offers undo for deleted games and game types too', async () => {
    setup(stashedDelete('Game'));
    actions$ = of(
      TrackplayActions.deleteGame(mockGame()),
      TrackplayActions.deleteGameType(mockGameType())
    );

    await firstValueFrom(effects.undoDeleteToast$.pipe(toArray()));
    await vi.waitFor(() =>
      expect(toastController.create).toHaveBeenCalledTimes(2)
    );

    // Both read the stash, not the action payload — that is where the reducer
    // put the name of what actually went away (a cascade deletes more).
    expect(presentedToast(0).message).toBe('Game');
    expect(presentedToast(1).message).toBe('Game');
  });

  it('stays silent when the reducer stashed nothing', async () => {
    setup(null);
    actions$ = of(TrackplayActions.deletePlayer(mockPlayer()));

    await firstValueFrom(effects.undoDeleteToast$);

    expect(toastController.create).not.toHaveBeenCalled();
  });

  it('ignores non-destructive actions', async () => {
    setup(stashedDelete('Alice'));
    actions$ = of(TrackplayActions.createPlayer('Bob'));

    expect(
      await firstValueFrom(effects.undoDeleteToast$.pipe(toArray()))
    ).toEqual([]);
    expect(toastController.create).not.toHaveBeenCalled();
  });
});
