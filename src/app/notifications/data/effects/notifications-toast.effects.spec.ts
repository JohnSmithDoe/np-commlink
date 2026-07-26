import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { NotificationsToastEffects } from './notifications-toast.effects';

describe('NotificationsToastEffects', () => {
  let actions$: Observable<Action>;
  let effects: NotificationsToastEffects;
  let toast: { present: ReturnType<typeof vi.fn> };
  let toastController: { create: ReturnType<typeof vi.fn> };

  const setup = () => {
    toast = { present: vi.fn().mockResolvedValue(undefined) };
    toastController = { create: vi.fn().mockResolvedValue(toast) };
    TestBed.configureTestingModule({
      providers: [
        NotificationsToastEffects,
        provideMockActions(() => actions$),
        { provide: ToastController, useValue: toastController },
        {
          provide: TranslateService,
          useValue: {
            get: (key: string, params?: Record<string, string>) =>
              of(params ? `${key}:${JSON.stringify(params)}` : key),
          },
        },
      ],
    });
    effects = TestBed.inject(NotificationsToastEffects);
  };

  it('translates the message key with its params and presents a success toast', async () => {
    setup();
    actions$ = of(
      NotificationsActions.toast({
        key: 'toast.add.item',
        params: { name: 'Ticket' },
      })
    );

    await firstValueFrom(effects.presentToast$);

    expect(toastController.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'toast.add.item:{"name":"Ticket"}',
        color: 'success',
      })
    );
    expect(toast.present).toHaveBeenCalledTimes(1);
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
});
