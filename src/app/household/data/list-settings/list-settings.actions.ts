import { createActionGroup } from '@ngrx/store';
import { BooleanKeys, ListSettings } from '../../model/list-settings.types';

export const ListSettingsActions = createActionGroup({
  source: 'ListSettings',
  events: {
    updateSettings: (settings: ListSettings) => ({ settings }),
    toggleFlag: (flag: BooleanKeys<ListSettings>) => ({ flag }),
  },
});
