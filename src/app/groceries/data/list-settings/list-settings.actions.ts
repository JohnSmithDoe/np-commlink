import { createActionGroup, emptyProps } from '@ngrx/store';
import { BooleanKeys } from '../../../@shared/types';
import { IListSettings } from '../../model';

export const ListSettingsActions = createActionGroup({
  source: 'ListSettings',
  events: {
    // Own-data lazy load lifecycle: the grocery-owned listSettings slice hydrates
    // from its own key via its route resolver (grocery routes + /list-settings), not at boot.
    load: emptyProps(),
    loaded: (listSettings: IListSettings | null) => ({ listSettings }),

    'Update Settings': (settings: IListSettings) => ({ settings }),
    'Toggle Flag': (flag: BooleanKeys<IListSettings>) => ({ flag }),
  },
});
