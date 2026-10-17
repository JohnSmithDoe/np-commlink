import { computed, inject, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectRouteEntityId } from '../../../@shared/data/router/router.selector';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../../@shared/util/item-lists/list.selector';
import { PEOPLE } from '../../../@shared/util/people/people.token';
import { TrackplayId } from '../../model/trackplay.types';
import { playersFrom } from '../../util/players.utils';
import { selectGameItems } from '../games/games.selector';
import { selectPlayersList } from '../trackplay.selector';
import {
  selectPlayerStats,
  selectStatsForRoutePlayer,
} from './players.selector';

const UNKNOWN_PLAYER = '—';

@Service()
export class PlayersFacade {
  readonly #store = inject(Store);
  readonly #people = inject(PEOPLE);
  readonly #games = this.#store.selectSignal(selectGameItems);
  readonly #view = this.#store.selectSignal(selectPlayersList);
  readonly #routeId = this.#store.selectSignal(selectRouteEntityId);

  readonly allItems = computed(() =>
    playersFrom(this.#people() ?? [], this.#games())
  );
  readonly state = computed(() => ({
    ...this.#view(),
    items: this.allItems(),
  }));
  readonly searchResult = computed(() => filterListBySearchQuery(this.state()));
  readonly items = computed(() =>
    filterAndSortItemList(this.state(), this.searchResult())
  );
  readonly stats = this.#store.selectSignal(selectPlayerStats);

  readonly routePlayer = computed(() =>
    this.allItems().find((player) => player.id === this.#routeId())
  );
  readonly routePlayerStats = this.#store.selectSignal(
    selectStatsForRoutePlayer
  );

  readonly #names = computed(
    () =>
      new Map((this.#people() ?? []).map((person) => [person.id, person.name]))
  );

  nameOf(id: TrackplayId): string {
    return this.#names().get(id) ?? UNKNOWN_PLAYER;
  }
}
