import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { mockKernelState } from '../../@shared/testing/test-data';
import { TrackplayDeleted } from '../model/trackplay.types';
import { mockTrackplayState } from '../testing/trackplay.test-data';
import { TrackplayActions } from './trackplay.actions';
import { TrackplayEffects } from './trackplay.effects';

type ToastButton = { text?: string; role?: string; handler?: () => void };
type PresentedToast = {
  header: string;
  message: string;
  buttons: ToastButton[];
};

const stashedDelete = (name: string): TrackplayDeleted => {
  const { players, games, gameTypes, rounds } = mockTrackplayState();
  return { name, snapshot: { players, games, gameTypes, rounds } };
};

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

  const stash = (lastDeleted: TrackplayDeleted | null): void =>
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

  const presentedToast = (index = 0): PresentedToast =>
    toastController.create.mock.calls[index][0] as PresentedToast;

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
