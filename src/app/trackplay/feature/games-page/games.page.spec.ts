import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  mockGame,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { TrackplayActions } from '../../data';
import { TrackplayGamesPage } from './games.page';

describe('TrackplayGamesPage', () => {
  let component: TrackplayGamesPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState()) => {
    TestBed.configureTestingModule({
      imports: [TrackplayGamesPage, TranslateModule.forRoot()],
      providers: [provideTestingProviders({ trackplay: state })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(TrackplayGamesPage).componentInstance;
  };

  it('dispatches deleteGame with the game', () => {
    const game = mockGame({ id: 'game-1' });
    setup();

    component.deleteGame(game);

    expect(dispatch).toHaveBeenCalledWith(TrackplayActions.deleteGame(game));
  });

  it('splits running and ended games and counts them', () => {
    const open = mockGame({ id: 'open', name: 'Open', ended: false });
    const done = mockGame({ id: 'done', name: 'Done', ended: true });
    setup(mockTrackplayState({ games: { open, done } }));

    expect(component.runningGames().map((g) => g.id)).toEqual(['open']);
    expect(component.endedGames().map((g) => g.id)).toEqual(['done']);
    expect(component.shownCount()).toBe(2);
    expect(component.totalCount()).toBe(2);
  });

  it('is not settings-active with the default config', () => {
    setup();

    expect(component.settingsActive()).toBe(false);
  });

  it('flags the settings button active while the list is filtered', () => {
    const base = mockTrackplayState();
    setup(
      mockTrackplayState({
        config: {
          ...base.config,
          games: { ...base.config.games, filter: 'skat' },
        },
      })
    );

    expect(component.settingsActive()).toBe(true);
  });

  it('resolves a game type name, falling back to the unknown-type label', () => {
    setup();

    expect(component.typeName(mockGame({ type: 'default' }))).toBe('Standard');
    expect(component.typeName(mockGame({ type: 'nope' }))).toBe(
      'trackplay.label.unknown-type'
    );
  });
});
