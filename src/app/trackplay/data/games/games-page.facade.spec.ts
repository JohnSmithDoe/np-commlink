/* ─── why ─────────────────────────────────────────────────────────
 * The counter is the case worth a spec: `shownCount` and `totalCount` read
 * two different signals, and the easiest way to get it wrong is to read the
 * filtered list twice — which passes every "does it render" check while the
 * counter silently says "2 / 2" over a filtered list of five.
 * ───────────────────────────────────────────────────────────────── */

import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import {
  mockGame,
  mockGamesState,
  mockGameType,
  mockGameTypesState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { GamesActions } from './games.actions';
import { GamesPageFacade } from './games-page.facade';

describe('GamesPageFacade', () => {
  let facade: GamesPageFacade;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      providers: [provideTestingProviders({ trackplay: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    facade = TestBed.inject(GamesPageFacade);
  };

  it('counts the shown games against the unfiltered total', () => {
    setup(
      mockTrackplayState({
        games: mockGamesState(
          [
            mockGame({ id: 'skat', name: 'Skat' }),
            mockGame({ id: 'romme', name: 'Rommé' }),
          ],
          { searchQuery: 'skat' }
        ),
      })
    );

    expect(facade.shownCount()).toBe(1);
    expect(facade.totalCount()).toBe(2);
  });

  it('offers the game types as its category catalog', () => {
    setup(
      mockTrackplayState({
        gameTypes: mockGameTypesState([mockGameType({ id: 'skat' })]),
      })
    );

    expect(facade.catalog().map((type) => type.id)).toEqual(['skat']);
  });

  it('flips the show-ended flag rather than setting it', () => {
    setup(
      mockTrackplayState({
        games: mockGamesState([], { showEndedGames: true }),
      })
    );

    facade.toggleShowEnded();

    expect(dispatch).toHaveBeenCalledWith(GamesActions.setShowEnded(false));
  });
});
