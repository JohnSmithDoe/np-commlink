import { createActionGroup, emptyProps } from '@ngrx/store';
import { ITrackingItem } from '../../../@shared/types';

//prettier-ignore
export const dialogsActions = createActionGroup({
  source: 'Dialogs',
  events: {
    'Show Edit Dialog': (item: ITrackingItem) => ({ item }),
    'Show Create Dialog With Search': emptyProps(),
    'Show Create By Ticket Dialog': emptyProps(),
    'Update Item': (data: Partial<ITrackingItem>) => ({ data }),
    'Hide Dialog': emptyProps(),
    'Confirm Changes': emptyProps(),
    'Abort Changes': emptyProps(),
  },
});
