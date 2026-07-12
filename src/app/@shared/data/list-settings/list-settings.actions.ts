import { createActionGroup } from '@ngrx/store';
import { BooleanKeys, IListSettings } from '../../types';

export const ListSettingsActions = createActionGroup({
  source: 'ListSettings',
  events: {
    'Update Settings': (settings: IListSettings) => ({ settings }),
    'Toggle Flag': (flag: BooleanKeys<IListSettings>) => ({ flag }),
  },
});
