/* ─── why ─────────────────────────────────────────────────────────
 * The filter is the case worth a spec. Five pieces have to agree for a game
 * type chip to narrow one player's history — the view's `filterBy`, the
 * reducer, `gameItems`, `selectCategory` and this facade's `catalog` — and
 * for a long time the last one was missing, so the other four were dead code
 * that no test would have noticed.
 * ───────────────────────────────────────────────────────────────── */

import { TestBed } from '@angular/core/testing';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { mockRouterState } from '../../../@shared/testing/test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import {
  mockGame,
  mockGamesForPlayerView,
  mockGamesState,
  mockGameType,
  mockGameTypesState,
  mockPlayer,
  mockPlayersState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { GamesForPlayerPageFacade } from './games-for-player-page.facade';

const PLAYER = 'player-1';

const stateWith = (filterBy?: string) =>
  mockTrackplayState({
    players: mockPlayersState([mockPlayer({ id: PLAYER, name: 'Ada' })]),
    gameTypes: mockGameTypesState([mockGameType({ id: 'skat', name: 'Skat' })]),
    gamesForPlayer: mockGamesForPlayerView({ filterBy }),
    games: mockGamesState([
      mockGame({
        id: 'g1',
        name: 'Skat night',
        playerIds: [PLAYER],
        categoryIds: ['skat'],
      }),
      mockGame({
        id: 'g2',
        name: 'Rommé night',
        playerIds: [PLAYER],
        categoryIds: ['romme'],
      }),
      mockGame({ id: 'g3', name: 'Someone else', playerIds: ['player-2'] }),
    ]),
  });

const setup = (filterBy?: string) => {
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({
        trackplay: stateWith(filterBy),
        router: mockRouterState({ parameters: { id: PLAYER } }),
      }),
    ],
  });
  return TestBed.inject(GamesForPlayerPageFacade);
};

describe('GamesForPlayerPageFacade', () => {
  it('lists only the route player’s games', () => {
    expect(
      setup()
        .items()
        .map(({ id }) => id)
    ).toEqual(['g1', 'g2']);
  });

  it('offers the game types as its category catalog, so chips can render', () => {
    expect(
      setup()
        .catalog()
        .map(({ id }) => id)
    ).toEqual(['skat']);
  });

  it('narrows the player’s games to the picked type', () => {
    expect(
      setup('skat')
        .items()
        .map(({ id }) => id)
    ).toEqual(['g1']);
  });

  it('seeds a new game with the type the chips are filtering by, and the route player', () => {
    const facade = setup('skat');

    facade.showCreateDialog();

    const request = TestBed.inject(ItemDialogService).request();
    expect(request?.item.categoryIds).toEqual(['skat']);
    expect(request?.editMode).toBe('create');
  });
});
