import { PROGRAM_RETURN } from '../../../@shared/util/program-return.token';
import { DECK_CATALOG } from '../../model/deck.catalog';
import { programReturnFor } from '../../util/program-route';

export const programReturnProvider = {
  provide: PROGRAM_RETURN,
  useValue: (url: string) => programReturnFor(DECK_CATALOG, url),
};
