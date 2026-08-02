import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockKernelState } from '../../../@shared/testing/test-data';
import {
  mockHouseholdState,
  mockListSettings,
} from '../../testing/household.test-data';
import { ListSettingsActions } from './list-settings.actions';
import { ListSettingsEffects } from './list-settings.effects';

describe('ListSettingsEffects', () => {
  let actions$: Observable<Action>;
  let effects: ListSettingsEffects;
  const setup = (initialState = mockKernelState()) => {
    TestBed.configureTestingModule({
      providers: [
        ListSettingsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
      ],
    });
    effects = TestBed.inject(ListSettingsEffects);
  };

  it('toggleFlag$ flips the requested flag on the current settings', async () => {
    const settings = mockListSettings({ showQuickAdd: false });
    setup(
      mockKernelState({
        household: mockHouseholdState({ listSettings: settings }),
      })
    );
    actions$ = of(ListSettingsActions.toggleFlag('showQuickAdd'));
    expect(await firstValueFrom(effects.toggleFlag$)).toEqual(
      ListSettingsActions.updateSettings({ ...settings, showQuickAdd: true })
    );
  });
});
