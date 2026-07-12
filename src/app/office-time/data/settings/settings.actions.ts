import { createActionGroup } from '@ngrx/store';
import { BooleanKeys, ISettingsState } from '../../../@shared/types';

export const SettingsActions = createActionGroup({
  source: 'Settings',
  events: {
    'Update Settings': (settings: ISettingsState) => ({ settings }),
    'Toggle Flag': (flag: BooleanKeys<ISettingsState>) => ({ flag }),
  },
});
