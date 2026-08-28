import { computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectUrl } from '../../../@shared/data/router/router.selector';
import { PROGRAM_ICON } from '../../../@shared/util/program-icon.token';
import { DECK_CATALOG } from '../../model/deck.catalog';
import { programIconFor } from '../../util/program-route';

export const programIconProvider = {
  provide: PROGRAM_ICON,
  useFactory: () => {
    const url = inject(Store).selectSignal(selectUrl);
    return computed(() => programIconFor(DECK_CATALOG, url() ?? ''));
  },
};
