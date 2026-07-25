import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockAppState } from '../../../@shared/testing/test-data';
import { mockListSettings } from '../../testing/grocery.test-data';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { ListSettingsActions } from '../list-settings/list-settings.actions';
import { ListSettingsEffects } from './list-settings.effects';

describe('ListSettingsEffects', () => {
  let actions$: Observable<Action>;
  let effects: ListSettingsEffects;
  let database: { save: ReturnType<typeof vi.fn> };

  const setup = (initialState = mockAppState()) => {
    database = { save: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        ListSettingsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        { provide: DatabaseService, useValue: database },
      ],
    });
    effects = TestBed.inject(ListSettingsEffects);
  };

  it('toggleFlag$ flips the requested flag on the current settings', async () => {
    const settings = mockListSettings({ showQuickAdd: false });
    setup(mockAppState({ listSettings: settings }));
    actions$ = of(ListSettingsActions.toggleFlag('showQuickAdd'));
    expect(await firstValueFrom(effects.toggleFlag$)).toEqual(
      ListSettingsActions.updateSettings({ ...settings, showQuickAdd: true })
    );
  });

  it('saveSettingsOnChange$ persists the updated settings', async () => {
    setup();
    const settings = mockListSettings({ showQuickAdd: true });
    actions$ = of(ListSettingsActions.updateSettings(settings));
    await firstValueFrom(effects.saveSettingsOnChange$);
    expect(database.save).toHaveBeenCalledWith('listSettings', settings);
  });
});
