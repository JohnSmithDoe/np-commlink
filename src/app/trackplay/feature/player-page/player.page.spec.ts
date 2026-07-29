import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Store } from '@ngrx/store';

import {
  mockGame,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { TrackplayActions } from '../../data';
import { TrackplayPlayerPage } from './player.page';

describe('TrackplayPlayerPage', () => {
  let component: TrackplayPlayerPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state = mockTrackplayState(), id = 'p1') => {
    TestBed.configureTestingModule({
      imports: [TrackplayPlayerPage],
      providers: [
        provideTestingProviders({ trackplay: state }),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(TrackplayPlayerPage).componentInstance;
  };

  it('reads the player id from the route', () => {
    setup();

    expect(component.id).toBe('p1');
  });

  it('dispatches deleteGame with the game', () => {
    const game = mockGame({ id: 'g1' });
    setup();

    component.deleteGame(game);

    expect(dispatch).toHaveBeenCalledWith(TrackplayActions.deleteGame(game));
  });

  it('resolves a game type name, falling back to the unknown-type label', () => {
    setup();

    expect(component.typeName(mockGame({ type: 'default' }))).toBe('Standard');
    expect(component.typeName(mockGame({ type: 'nope' }))).toBe(
      'trackplay.label.unknown-type'
    );
  });
});
