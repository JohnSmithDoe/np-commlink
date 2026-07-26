import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { mockTrackplayState } from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { TrackplayActions } from '../../data';
import { TrackplayListSettingsPopoverComponent } from './list-settings-popover.component';

type TSettingsMode = 'games' | 'players' | 'gamesForPlayer';

describe('TrackplayListSettingsPopoverComponent', () => {
  let component: TrackplayListSettingsPopoverComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (mode: TSettingsMode = 'games') => {
    TestBed.configureTestingModule({
      imports: [
        TrackplayListSettingsPopoverComponent,
        TranslateModule.forRoot(),
      ],
      providers: [provideTestingProviders({ trackplay: mockTrackplayState() })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      TrackplayListSettingsPopoverComponent
    ).componentInstance;
    component.mode = mode;
  };

  it('updates the games config in games mode', () => {
    setup('games');

    component.setShowEnded(false);
    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.updateGamesConfig({ showEndedGames: false })
    );

    component.setTypeId('skat');
    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.updateGamesConfig({ typeId: 'skat' })
    );

    component.setGamesFilter('rob');
    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.updateGamesConfig({ filter: 'rob' })
    );

    component.setGamesDir('asc');
    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.updateGamesConfig({ dir: 'asc' })
    );

    component.setGamesSort('name');
    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.updateGamesConfig({ sort: 'name' })
    );
  });

  it('updates the gamesForPlayer config in gamesForPlayer mode', () => {
    setup('gamesForPlayer');

    component.setShowEnded(true);

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.updateGamesForPlayerConfig({ showEndedGames: true })
    );
  });

  it('updates the players config in players mode', () => {
    setup('players');

    component.setPlayersFilter('al');
    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.updatePlayersConfig({ filter: 'al' })
    );

    component.setPlayersDir('desc');
    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.updatePlayersConfig({ dir: 'desc' })
    );

    component.setPlayersSort('last');
    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.updatePlayersConfig({ sort: 'last' })
    );
  });

  it('exposes the players config while in players mode', () => {
    setup('players');

    expect(component.isPlayers()).toBe(true);
    expect(component.playersConfig().sort).toBe('name');
  });

  it('reads the gamesForPlayer config while in gamesForPlayer mode', () => {
    setup('gamesForPlayer');

    expect(component.isPlayers()).toBe(false);
    expect(component.gamesConfig().showEndedGames).toBe(false);
  });
});
