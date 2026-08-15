/* ─── why ─────────────────────────────────────────────────────────
 * The default type is pinned first, which is not something a sort key can
 * express — so this keeps a local comparator where players and games hand
 * the job to `itemComparator`. Everything else about the list is shared.
 * ───────────────────────────────────────────────────────────────── */

import { createSelector } from '@ngrx/store';
import { SearchResult } from '../../../@shared/model/item-list.types';
import { filterListBySearchQuery } from '../../../@shared/util/item-lists/list.selector';
import { GameType, TrackplayId } from '../../model/trackplay.types';
import { DEFAULT_GAME_TYPE_ID } from '../../util/trackplay.factory';
import { selectGameTypesList } from '../trackplay.selector';

const defaultTypeFirst = (a: GameType, b: GameType): number => {
  if (a.id === DEFAULT_GAME_TYPE_ID) return -1;
  if (b.id === DEFAULT_GAME_TYPE_ID) return 1;
  return a.name.localeCompare(b.name);
};

export const selectGameTypeItems = createSelector(
  selectGameTypesList,
  (list): GameType[] => list.items
);

export const selectGameTypesSearchResult = createSelector(
  selectGameTypesList,
  (list): SearchResult<GameType> | undefined => filterListBySearchQuery(list)
);

export const selectGameTypesListItems = createSelector(
  selectGameTypesList,
  selectGameTypesSearchResult,
  (list, result): GameType[] =>
    (result?.listItems ?? list.items).toSorted(defaultTypeFirst)
);

export const selectGameTypeById = (typeId: TrackplayId) =>
  createSelector(selectGameTypeItems, (types): GameType | undefined =>
    types.find((type) => type.id === typeId)
  );
