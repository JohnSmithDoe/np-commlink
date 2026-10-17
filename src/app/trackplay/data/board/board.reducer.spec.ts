import { BoardFigure, BoardState } from '../../model/board.types';
import { TrackplayState } from '../../model/trackplay.types';
import { initialBoardState, MADN_RULES } from '../../util/trackplay.factory';
import { TrackplayActions } from '../trackplay.actions';
import { BoardActions } from './board.actions';
import { boardReducer } from './board.reducer';

const figure: BoardFigure = { player: 0, piece: 0, fieldId: 'track-5' };

const seated = (): BoardState => {
  return {
    ...initialBoardState,
    figures: [figure],
  };
};

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

  it('moves a figure and throws the one it lands on home', () => {
    const state = {
      ...initialBoardState,
      figures: [figure, { player: 1, piece: 0, fieldId: 'track-8' }],
    };

    const next = boardReducer(state, BoardActions.moveFigure('track-5', 3));

    expect(next.figures).toHaveLength(2);
    expect(next.figures).toContainEqual({ ...figure, fieldId: 'track-8' });
    expect(next.figures).toContainEqual({
      player: 1,
      piece: 0,
      fieldId: 'nest-1-0',
    });
  });

  it('moves by the rules the board holds', () => {
    const inYard = { ...figure, fieldId: 'nest-0-0' };
    const state = { ...initialBoardState, figures: [inYard] };
    const leave = BoardActions.moveFigure('nest-0-0', 1);

    expect(boardReducer(state, leave)).toBe(state);

    const loose = boardReducer(state, BoardActions.setRules({ entryRoll: 1 }));
    expect(boardReducer(loose, leave).figures).toEqual([
      { ...inYard, fieldId: 'start-0' },
    ]);
  });

  it('places the next figure on a free field and refuses foreign ground', () => {
    const placed = boardReducer(
      initialBoardState,
      BoardActions.placeOn('track-7')
    );

    expect(placed.figures).toEqual([
      { player: 0, piece: 0, fieldId: 'track-7' },
    ]);
    expect(boardReducer(placed, BoardActions.placeOn('nest-1-0')).figures).toBe(
      placed.figures
    );
  });

  it('loads a valid setting with its own seat count', () => {
    const setting = [figure, { player: 5, piece: 0, fieldId: 'nest-5-0' }];

    const next = boardReducer(seated(), BoardActions.loadSetting(6, setting));

    expect(next.players).toBe(6);
    expect(next.figures).toEqual(setting);
    expect(next.rules).toBe(initialBoardState.rules);
  });

  it('merges a partial rule change into the rules it has', () => {
    const next = boardReducer(
      seated(),
      BoardActions.setRules({ blockOwn: true, exactHome: false })
    );

    expect(next.rules).toEqual({
      ...MADN_RULES,
      blockOwn: true,
      exactHome: false,
    });
    expect(next.figures).toEqual([figure]);
  });
});
