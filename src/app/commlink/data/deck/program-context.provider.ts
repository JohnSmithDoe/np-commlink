import { PROGRAM_CONTEXT } from '../../../@shared/util/program-context.token';
import { DECK_CATALOG } from '../../model/deck.catalog';
import { programContextFor } from '../../util/program-route';

export const programContextProvider = {
  provide: PROGRAM_CONTEXT,
  useValue: (url: string) => programContextFor(DECK_CATALOG, url),
};
