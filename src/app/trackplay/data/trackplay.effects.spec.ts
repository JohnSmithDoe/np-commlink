import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { mockKernelState } from '../../@shared/testing/test-data';
import { ITrackplayDeleted } from '../model/trackplay.types';
import { mockTrackplayState } from '../testing/trackplay.test-data';
import { TrackplayActions } from './trackplay.actions';
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

// The toast is presented from an async method, so a *negative* assertion has to
// outlast the microtask queue the effect's tap kicks off.
const settle = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

describe('TrackplayEffects', () => {
  let effects: TrackplayEffects;
  let store: MockStore;
  let subscription: Subscription;
  let toast: {
    present: ReturnType<typeof vi.fn>;
    dismiss: ReturnType<typeof vi.fn>;
  };
  let toastController: {
    create: ReturnType<typeof vi.fn>;
    getTop: ReturnType<typeof vi.fn>;
    dismiss: ReturnType<typeof vi.fn>;
  };

  // The effect watches the slice, not the action bus, so a spec drives it the
  // way the reducer does: by publishing what the delete stashed.
  const stash = (lastDeleted: ITrackplayDeleted | null): void =>
    store.setState(
      mockKernelState({ trackplay: mockTrackplayState({ lastDeleted }) })
    );

  const setup = () => {
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
        provideMockStore({
          initialState: mockKernelState({ trackplay: mockTrackplayState() }),
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
    subscription = effects.undoDeleteToast$.subscribe();
  };

  afterEach(() => subscription.unsubscribe());

  const presentedToast = (index = 0): TPresentedToast =>
    toastController.create.mock.calls[index][0] as TPresentedToast;

  it('offers undo for the entity the reducer stashed', async () => {
    setup();

    stash(stashedDelete('Alice'));

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
    setup();
    const dispatch = vi.spyOn(store, 'dispatch');

    stash(stashedDelete('Alice'));

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
   */
  it('dismisses its own still-open undo toast before presenting the next one', async () => {
    setup();

    stash(stashedDelete('Skat'));
    await vi.waitFor(() => expect(toast.present).toHaveBeenCalledTimes(1));

    stash(stashedDelete('Rommé'));
    await vi.waitFor(() => expect(toast.present).toHaveBeenCalledTimes(2));

    expect(presentedToast(1).message).toBe('Rommé');
    expect(toast.dismiss).toHaveBeenCalledWith(null, 'cancel');
    expect(toastController.dismiss).not.toHaveBeenCalled();
  });

  // Deleting the built-in game type is refused by the reducer: the stash keeps
  // its identity, and offering undo then meant offering to restore an unrelated
  // earlier deletion.
  it('stays quiet when a refused delete leaves the stash untouched', async () => {
    setup();
    const stashed = stashedDelete('Alice');

    stash(stashed);
    await vi.waitFor(() => expect(toast.present).toHaveBeenCalledTimes(1));
    stash(stashed);
    await settle();

    expect(toast.present).toHaveBeenCalledTimes(1);
  });

  it('stays silent while nothing is stashed', async () => {
    setup();

    stash(null);
    await settle();

    expect(toastController.create).not.toHaveBeenCalled();
  });

  it('offers undo again after the previous snapshot was restored', async () => {
    setup();

    stash(stashedDelete('Alice'));
    await vi.waitFor(() => expect(toast.present).toHaveBeenCalledTimes(1));
    stash(null);
    stash(stashedDelete('Bob'));
    await vi.waitFor(() => expect(toast.present).toHaveBeenCalledTimes(2));

    expect(presentedToast(1).message).toBe('Bob');
  });
});
