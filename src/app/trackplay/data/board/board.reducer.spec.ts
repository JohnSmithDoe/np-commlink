import { BoardFigure, BoardState } from '../../model/board.types';
import { TrackplayState } from '../../model/trackplay.types';
import { initialBoardState, MADN_RULES } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { BoardActions } from './board.actions';
import { boardReducer } from './board.reducer';

const figure: BoardFigure = { player: 0, piece: 0, fieldId: 'track-5' };

const seated = (over: Partial<BoardState> = {}): BoardState => ({
  ...initialBoardState,
  figures: [figure],
  ...over,
});

describe('boardReducer', () => {
  it('keeps the figures when the same seat count is picked again', () => {
    const state = seated();

    expect(boardReducer(state, BoardActions.seatPlayers(4))).toBe(state);
  });

  it('clears the figures when the seat count actually changes', () => {
    const next = boardReducer(seated(), BoardActions.seatPlayers(6));

    expect(next.players).toBe(6);
    expect(next.figures).toEqual([]);
  });

  it('keeps the board when a setting does not describe one', () => {
    const state = seated();
    const refused = BoardActions.loadSetting(4, [
      figure,
      { ...figure, piece: 1, fieldId: 'track-5' },
    ]);

    expect(boardReducer(state, refused)).toBe(state);
  });

  it('keeps the board when a move is refused', () => {
    const state = seated();
    const nowhere = BoardActions.moveFigure('track-40', 3);

    expect(boardReducer(state, nowhere)).toBe(state);
  });

  it('fills a stored board out with the rules it was saved without', () => {
    const stored = {
      board: { players: 6, figures: [figure] },
    } as unknown as TrackplayState;

    const next = boardReducer(
      initialBoardState,
      TrackplayActions.loaded(stored)
    );

    expect(next.players).toBe(6);
    expect(next.figures).toEqual([figure]);
    expect(next.rules).toEqual(MADN_RULES);
  });

  it('keeps the board it has when nothing was stored', () => {
    const next = boardReducer(seated(), TrackplayActions.loaded(null));

    expect(next).toEqual(seated());
  });
});
