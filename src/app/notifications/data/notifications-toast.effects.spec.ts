import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, lastValueFrom, Observable, of } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { NotificationsToastEffects } from './notifications-toast.effects';

type ToastButton = { text?: string; role?: string; handler?: () => void };
type PresentedToast = {
  message: string;
  duration: number;
  color: string;
  buttons: ToastButton[];
  htmlAttributes?: Record<string, string>;
};
type ToastElement = {
  present: ReturnType<typeof vi.fn>;
  dismiss: ReturnType<typeof vi.fn>;
  onDidDismiss: ReturnType<typeof vi.fn>;
};

const stubToast = (): ToastElement => ({
  present: vi.fn().mockResolvedValue(undefined),
  dismiss: vi.fn().mockResolvedValue(true),
  onDidDismiss: vi.fn().mockReturnValue(new Promise<void>(vi.fn())),
});

const inGroup = (key: string) =>
  NotificationsActions.toast({ key, group: 'undo' });

describe('NotificationsToastEffects', () => {
  let actions$: Observable<Action>;
  let effects: NotificationsToastEffects;
  let store: MockStore;
  let created: ToastElement[];
  let toastController: { create: ReturnType<typeof vi.fn> };

  const setup = () => {
    created = [];
    toastController = {
      create: vi.fn().mockImplementation(() => {
        const toast = stubToast();
        created.push(toast);
        return Promise.resolve(toast);
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        NotificationsToastEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: ToastController, useValue: toastController },
        {
          provide: TranslateService,
          useValue: {
            get: (key: string, parameters?: Record<string, string>) =>
              of(parameters ? `${key}:${JSON.stringify(parameters)}` : key),
          },
        },
      ],
    });
    store = TestBed.inject(MockStore);
    effects = TestBed.inject(NotificationsToastEffects);
  };

  const presented = (index = 0): PresentedToast =>
    toastController.create.mock.calls[index][0] as PresentedToast;

  it('translates the message key with its parameters and presents a success toast', async () => {
    setup();
    actions$ = of(
      NotificationsActions.toast({
        key: 'toast.add.item',
        parameters: { name: 'Ticket' },
      })
    );

    await firstValueFrom(effects.presentToast$);

    expect(toastController.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'toast.add.item:{"name":"Ticket"}',
        color: 'accent',
      })
    );
    expect(created[0].present).toHaveBeenCalledTimes(1);
  });

  it('honours an explicit color', async () => {
    setup();
    actions$ = of(
      NotificationsActions.toast({ key: 'toast.saved', color: 'warning' })
    );

    await firstValueFrom(effects.presentToast$);

    expect(toastController.create).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'toast.saved', color: 'warning' })
    );
  });

  it('offers only a dismiss button when no action was set', async () => {
    setup();
    actions$ = of(NotificationsActions.toast({ key: 'toast.saved' }));

    await firstValueFrom(effects.presentToast$);

    expect(presented().buttons).toEqual([{ text: 'X', role: 'cancel' }]);
    expect(presented().htmlAttributes).toBeUndefined();
    expect(presented().duration).toBe(1500);
  });

  it('honours an explicit duration', async () => {
    setup();
    actions$ = of(
      NotificationsActions.toast({ key: 'toast.saved', durationMs: 8000 })
    );

    await firstValueFrom(effects.presentToast$);

    expect(presented().duration).toBe(8000);
  });

  it('dispatches the offered action when its button is tapped', async () => {
    setup();
    const dispatch = vi.spyOn(store, 'dispatch');
    actions$ = of(
      NotificationsActions.toast({
        key: 'trackplay.toast.undo-delete',
        action: {
          labelKey: 'trackplay.toast.undo',
          action: { type: '[Trackplay] restoreLastDeleted' },
        },
      })
    );

    await firstValueFrom(effects.presentToast$);
    const offered = presented().buttons.find((button) => !!button.handler);
    offered?.handler?.();

    expect(offered?.text).toBe('trackplay.toast.undo');
    expect(presented().htmlAttributes).toEqual({
      'data-testid': 'action-toast',
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: '[Trackplay] restoreLastDeleted',
    });
  });

  it('dismisses the incumbent of a group before presenting its successor', async () => {
    setup();
    actions$ = of(inGroup('toast.first'), inGroup('toast.second'));

    await lastValueFrom(effects.presentToast$);

    expect(created).toHaveLength(2);
    expect(created[0].dismiss).toHaveBeenCalledWith(null, 'cancel');
    expect(created[1].dismiss).not.toHaveBeenCalled();
    expect(presented(1).message).toBe('toast.second');
  });

  it('leaves ungrouped toasts to stack, dismissing none of them', async () => {
    setup();
    actions$ = of(
      NotificationsActions.toast({ key: 'toast.first' }),
      NotificationsActions.toast({ key: 'toast.second' })
    );

    await lastValueFrom(effects.presentToast$);

    expect(created[0].dismiss).not.toHaveBeenCalled();
    expect(created[1].dismiss).not.toHaveBeenCalled();
  });
});
