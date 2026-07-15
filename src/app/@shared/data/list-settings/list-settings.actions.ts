import { createActionGroup, emptyProps } from '@ngrx/store';
import { BooleanKeys, IListSettings } from '../../types';

export const ListSettingsActions = createActionGroup({
  source: 'ListSettings',
  events: {
    // Own-data lazy load lifecycle (lazy-modules plan §2). listSettings is
    // eager shared-kernel state, but still loads its own key at boot.
    load: emptyProps(),
    loaded: (listSettings: IListSettings | null) => ({ listSettings }),

    'Update Settings': (settings: IListSettings) => ({ settings }),
    'Toggle Flag': (flag: BooleanKeys<IListSettings>) => ({ flag }),
  },
});
