import { createActionGroup, emptyProps } from '@ngrx/store';
import { BooleanKeys } from '../../../@shared/types';
import { IOfficeTimeSettingsState } from '../../model';

export const OfficeTimeSettingsActions = createActionGroup({
  source: 'OfficeTimeSettings',
  events: {
    // Own-data lazy load lifecycle (lazy-modules plan §2).
    load: emptyProps(),
    loaded: (settings: IOfficeTimeSettingsState | null) => ({ settings }),

    'Update Settings': (settings: IOfficeTimeSettingsState) => ({ settings }),
    'Toggle Flag': (flag: BooleanKeys<IOfficeTimeSettingsState>) => ({ flag }),
  },
});
