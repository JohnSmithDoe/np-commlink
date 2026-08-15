import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Store } from '@ngrx/store';

import {
  mockGame,
  mockGamesState,
  mockPlayer,
  mockPlayersState,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { GamesActions } from '../../data';
import { TrackplayGamePlayPage } from './game-play.page';

const inputEvent = (value: string): Event =>
  ({ target: { value } }) as unknown as Event;

const scored = (value: number) =>
  expect.objectContaining({
    type: GamesActions.setRoundValue.type,
    gameId: 'g1',
    roundId: 'r1',
    playerId: 'p1',
    value,
  });

describe('TrackplayGamePlayPage', () => {
  let component: TrackplayGamePlayPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState(), id = 'g1') => {
    TestBed.configureTestingModule({
      imports: [TrackplayGamePlayPage],
      providers: [
        provideTestingProviders({ trackplay: state }),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(
      TrackplayGamePlayPage
    ).componentInstance;
  };

  it('reads the game id from the route', () => {
    setup();

    expect(component.id).toBe('g1');
  });

  it('dispatches enterGamePage with the route id on ionViewWillEnter', () => {
    setup();

    component.ionViewWillEnter();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: GamesActions.enterGamePage.type,
        gameId: 'g1',
      })
    );
  });

  it('dispatches setRoundValue parsing the input value', () => {
    setup();

    component.onValue('r1', 'p1', inputEvent('15'));

    expect(dispatch).toHaveBeenCalledWith(scored(15));
  });

  it('coerces a blank or non-numeric cell to 0', () => {
    setup();

    component.onValue('r1', 'p1', inputEvent(''));

    expect(dispatch).toHaveBeenCalledWith(scored(0));
  });

  it('flips the ended flag of the game it is showing', () => {
    const game = mockGame({ id: 'g1', ended: false });
    setup(mockTrackplayState({ games: mockGamesState([game]) }));

    component.toggleEnded();

    expect(dispatch).toHaveBeenCalledWith(
      GamesActions.updateItem({ ...game, ended: true })
    );
  });

  it('derives player order, ended flag and player names from the game', () => {
    const game = mockGame({ id: 'g1', playerIds: ['p1', 'p2'], ended: true });
    setup(
      mockTrackplayState({
        games: mockGamesState([game]),
        players: mockPlayersState([mockPlayer({ id: 'p1', name: 'Alice' })]),
      })
    );

    expect(component.playerIds()).toEqual(['p1', 'p2']);
    expect(component.ended()).toBe(true);
    expect(component.playerName('p1')).toBe('Alice');
    expect(component.playerName('nope')).toBe('');
  });
});
