import { createActionGroup, emptyProps } from '@ngrx/store';
import { LoadedDatastore } from '../types';

export const ApplicationActions = createActionGroup({
  source: 'Application',
  events: {
    load: emptyProps(),
    loadedSuccessfully: (datastore: LoadedDatastore) => ({ datastore }),
    save: emptyProps(),
  },
});
