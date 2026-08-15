import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import {
  mockGame,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { GamesActions } from '../../data';
import { TrackplayGamesPage } from './games.page';

describe('TrackplayGamesPage', () => {
  let component: TrackplayGamesPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      imports: [TrackplayGamesPage],
      providers: [provideTestingProviders({ trackplay: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(TrackplayGamesPage).componentInstance;
  };

  it('dispatches removeItem with the game', () => {
    const game = mockGame({ id: 'game-1' });
    setup();

    component.deleteGame(game);

    expect(dispatch).toHaveBeenCalledWith(GamesActions.removeItem(game));
  });
});
