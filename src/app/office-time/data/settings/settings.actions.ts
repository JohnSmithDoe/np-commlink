import { createActionGroup, emptyProps } from '@ngrx/store';
import { BooleanKeys } from '../../../@shared/types';
import { ISettingsState } from '../../model';

export const SettingsActions = createActionGroup({
  source: 'Settings',
  events: {
    // Own-data lazy load lifecycle (lazy-modules plan §2).
    load: emptyProps(),
    loaded: (settings: ISettingsState | null) => ({ settings }),

    'Update Settings': (settings: ISettingsState) => ({ settings }),
    'Toggle Flag': (flag: BooleanKeys<ISettingsState>) => ({ flag }),
  },
});
