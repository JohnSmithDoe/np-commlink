import { createRouteScopedListSelectors } from '../../../@shared/data/item-lists/route-scoped-list.selector';
import { Pill, PillsState } from '../../model/vitals.types';
import { pillsOf } from '../../util/pill.utils';
import { selectPillsList } from '../vitals.selector';

const routeScoped = createRouteScopedListSelectors<Pill, PillsState>(
  selectPillsList,
  pillsOf
);

export const selectPillItems = routeScoped.selectItems;
export const selectRouteProfilePills = routeScoped.selectScopedItems;
export const selectPillsSearchResult = routeScoped.selectSearchResult;
export const selectPillsListItems = routeScoped.selectListItems;
