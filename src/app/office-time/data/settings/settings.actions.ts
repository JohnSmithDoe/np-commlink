import { createActionGroup, emptyProps } from '@ngrx/store';
import { BooleanKeys, ISettingsState } from '../../../@shared/types';

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
