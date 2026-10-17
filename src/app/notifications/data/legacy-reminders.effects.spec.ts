import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { LocalNotificationsService } from '../../@shared/data/services/local-notifications.service';
import { LegacyRemindersEffects } from './legacy-reminders.effects';
import { NotificationsInboxActions } from './notifications.actions';
import { selectLegacyCronsCleared } from './notifications.selector';

const drain = () => {
  const { clearLegacyCrons$ } = TestBed.inject(LegacyRemindersEffects);
  return firstValueFrom(clearLegacyCrons$.pipe(toArray()));
};

describe('LegacyRemindersEffects', () => {
  let actions$: Observable<Action>;
  let store: MockStore;
  let cancel: ReturnType<typeof vi.fn>;

  const setup = (isCleared: boolean) => {
    cancel = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        LegacyRemindersEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: LocalNotificationsService, useValue: { cancel } },
      ],
    });
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectLegacyCronsCleared, isCleared);
    actions$ = of(NotificationsInboxActions.loaded(null));
  };

  afterEach(() => {
    store.resetSelectors();
  });

  it('cancels the office cron and records it, when not yet cleared', async () => {
    setup(false);

    const emitted = await drain();

    expect(cancel).toHaveBeenCalledExactlyOnceWith('officeReminder');
    expect(emitted).toEqual([NotificationsInboxActions.legacyCronsCleared()]);
  });

  it('touches nothing once the cron has been cleared', async () => {
    setup(true);

    const emitted = await drain();

    expect(cancel).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('still records the clear when the cancel rejects, so it never retries', async () => {
    setup(false);
    cancel.mockRejectedValue(new Error('plugin unavailable'));

    const emitted = await drain();

    expect(emitted).toEqual([NotificationsInboxActions.legacyCronsCleared()]);
  });
});
