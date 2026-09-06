import { PROGRAM_SIBLINGS } from '../../../@shared/util/program-siblings.token';
import { DECK_CATALOG } from '../../model/deck.catalog';
import { programSiblingsFor } from '../../util/program-route';

export const programSiblingsProvider = {
  provide: PROGRAM_SIBLINGS,
  useValue: (prefix: string) => programSiblingsFor(DECK_CATALOG, prefix),
};
