import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { IGame } from '../../model/trackplay.types';
import {
  mockGame,
  mockPlayer,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import { setupModalSpec } from '../../../@shared/testing/modal-spec';
import { TrackplayActions } from '../../data';
import { TrackplayGameEditModalComponent } from './game-edit-modal.component';

const editState = () =>
  mockTrackplayState({
    games: {
      g1: mockGame({
        id: 'g1',
        name: 'Skat',
        type: 'default',
        players: ['p1'],
      }),
    },
    players: { p1: mockPlayer({ id: 'p1', name: 'Alice' }) },
  });

describe('TrackplayGameEditModalComponent', () => {
  let component: TrackplayGameEditModalComponent;
  let dispatch: ReturnType<typeof vi.spyOn>;
  let dismiss: ReturnType<typeof vi.spyOn>;

  // The created games (the action carries a pre-minted entity, so the id and the
  // timestamps are only knowable from the dispatch itself).
  const created = (): IGame[] =>
    (dispatch.mock.calls as Array<[{ type: string; game?: IGame }]>)
      .map((call) => call[0])
      .filter((action) => action.type === TrackplayActions.createGame.type)
      .map((action) => action.game as IGame);

  const setup = (state = mockTrackplayState()) => {
    ({ component, dispatch, dismiss } = setupModalSpec(
      TrackplayGameEditModalComponent,
      { trackplay: state }
    ));
  };

  it('dispatches createGame in create mode', () => {
    setup();

    component.patch({ name: 'New game' });
    component.confirm();

    expect(created()).toEqual([
      expect.objectContaining({
        name: 'New game',
        type: 'default',
        players: [],
      }),
    ]);
    expect(dismiss).toHaveBeenCalled();
  });

  it('creates with the preset player ids', () => {
    setup();

    component.presetPlayerIds = ['p1'];
    component.patch({ name: 'New game' });
    component.confirm();

    expect(created()).toEqual([
      expect.objectContaining({ name: 'New game', players: ['p1'] }),
    ]);
  });

  // The chosen type rides along in the create action; it used to take a second
  // dispatch, aimed at an id reverse-engineered from the games map.
  it('creates with the chosen type in a single dispatch', () => {
    setup();

    component.patch({ name: 'Canasta', typeId: 'skat' });
    component.confirm();

    expect(created()).toEqual([expect.objectContaining({ type: 'skat' })]);
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: TrackplayActions.changeGameType.type })
    );
  });

  it('navigates to the game it just created', () => {
    setup();
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    component.patch({ name: 'New game', playerIds: ['p1'] });
    component.goToGame();

    expect(navigate).toHaveBeenCalledWith(['/trackplay/game', created()[0].id]);
    expect(dismiss).toHaveBeenCalled();
  });

  // Unreachable via the UI (the OK button is `[disabled]="!canSave()"`), but the
  // guard is uniform across all the modal dialogs now: confirm with an invalid
  // draft is a no-op and leaves the dialog open. This dialog used to be the odd
  // one out, dismissing anyway.
  it('neither creates nor dismisses without a name', () => {
    setup();

    component.confirm();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).not.toHaveBeenCalled();
  });

  // The componentProps write into signals, so the draft seeds reactively — no
  // ngOnInit to call (and none to forget).
  it('seeds the draft from the edited game', () => {
    setup(editState());

    component.gameId = 'g1';

    expect(component.isEdit()).toBe(true);
    expect(component.draft()).toEqual({
      name: 'Skat',
      typeId: 'default',
      playerIds: ['p1'],
    });
    // The stable original selection drives the player-select display order.
    expect(component.initialPlayerIds()).toEqual(['p1']);
  });

  it('dispatches renameGame when the name changes in edit mode', () => {
    setup(editState());

    component.gameId = 'g1';
    component.patch({ name: 'Doppelkopf' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.renameGame('g1', 'Doppelkopf')
    );
  });

  it('dispatches changeGameType when the type changes in edit mode', () => {
    setup(editState());

    component.gameId = 'g1';
    component.patch({ typeId: 'skat' });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.changeGameType('g1', 'skat')
    );
  });

  it('dispatches setGamePlayers when the roster changes in edit mode', () => {
    setup(editState());

    component.gameId = 'g1';
    component.patch({ playerIds: ['p1', 'p2'] });
    component.confirm();

    expect(dispatch).toHaveBeenCalledWith(
      TrackplayActions.setGamePlayers('g1', ['p1', 'p2'])
    );
  });

  it('computes canSave and canPlay from name and roster', () => {
    setup();

    expect(component.canSave()).toBe(false);
    expect(component.canPlay()).toBe(false);

    component.patch({ name: 'Skat' });
    expect(component.canSave()).toBe(true);
    expect(component.canPlay()).toBe(false);

    component.patch({ playerIds: ['p1'] });
    expect(component.canPlay()).toBe(true);
  });

  it('dismisses without dispatching on cancel', () => {
    setup();

    component.cancel();

    expect(dispatch).not.toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalled();
  });
});
