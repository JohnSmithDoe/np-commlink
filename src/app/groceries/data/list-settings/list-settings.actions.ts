import { createActionGroup } from '@ngrx/store';
import { BooleanKeys, IListSettings } from '../../model/list-settings.types';

export const ListSettingsActions = createActionGroup({
  source: 'ListSettings',
  events: {
    // No `load`/`loaded`: the flags are an aggregate of the one `groceries`
    // slice and hydrate on `[Groceries] loaded` with the lists they gate.
    updateSettings: (settings: IListSettings) => ({ settings }),
    toggleFlag: (flag: BooleanKeys<IListSettings>) => ({ flag }),
  },
});
