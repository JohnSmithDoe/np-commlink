import { BoardFigure } from '../model/board.types';
import { buildBoard } from './board.factory';
import {
  figureCount,
  figureOn,
  homeFieldId,
  nextFigure,
  placeFigure,
  placeNextAtHome,
  refuseFigure,
  refuseNext,
  takeBack,
  validateSetting,
} from './board.setup';

const board = buildBoard(4);

const fill = (count: number): readonly BoardFigure[] => {
  let placed: readonly BoardFigure[] = [];
  for (let step = 0; step < count; step++) {
    placed = placeNextAtHome(board, placed);
  }
  return placed;
};

describe('board setup', () => {
  it('wants one figure per piece per player', () => {
    expect(figureCount(board)).toBe(16);
    expect(figureCount(buildBoard(12))).toBe(48);
  });

  it('hands out figures player by player, piece by piece', () => {
    expect(nextFigure(board, [])).toEqual({ player: 0, piece: 0 });
    expect(nextFigure(board, fill(3))).toEqual({ player: 0, piece: 3 });
    expect(nextFigure(board, fill(4))).toEqual({ player: 1, piece: 0 });
    expect(nextFigure(board, fill(15))).toEqual({ player: 3, piece: 3 });
  });

  it('runs out once every figure stands', () => {
    expect(nextFigure(board, fill(16))).toBeNull();
    expect(placeFigure(board, fill(16), 'track-1')).toHaveLength(16);
  });

  it('places the next figure on the field it is given', () => {
    const placed = placeFigure(board, [], 'track-7');

    expect(placed).toEqual([{ player: 0, piece: 0, fieldId: 'track-7' }]);
    expect(figureOn(placed, 'track-7')).toBeDefined();
    expect(figureOn(placed, 'track-8')).toBeUndefined();
  });

  it('refuses a field that is already taken', () => {
    const placed = placeFigure(board, [], 'track-7');

    expect(placeFigure(board, placed, 'track-7')).toBe(placed);
  });

  it('sends a figure home to its own yard slot', () => {
    expect(homeFieldId(2, 3)).toBe('nest-2-3');
    expect(fill(6).at(-1)).toEqual({
      player: 1,
      piece: 1,
      fieldId: 'nest-1-1',
    });
  });

  it('fills every yard slot the board actually has', () => {
    const ids = new Set(board.fields.map((field) => field.id));

    for (const figure of fill(16)) {
      expect(ids.has(figure.fieldId)).toBe(true);
    }
  });

  it('takes the last figure back', () => {
    expect(takeBack(fill(3))).toHaveLength(2);
    expect(takeBack([])).toHaveLength(0);
  });

  it('lets a figure onto any track field — it is common ground', () => {
    expect(refuseFigure(board, [], 0, 'track-13')).toBeNull();
    expect(refuseFigure(board, [], 0, 'start-2')).toBeNull();
    expect(refuseFigure(board, [], 3, 'track-1')).toBeNull();
  });

  it('keeps a yard and a home column to their own player', () => {
    expect(refuseFigure(board, [], 0, 'nest-0-0')).toBeNull();
    expect(refuseFigure(board, [], 0, 'goal-0-2')).toBeNull();
    expect(refuseFigure(board, [], 0, 'nest-1-0')).toBe('foreign-ground');
    expect(refuseFigure(board, [], 0, 'goal-3-1')).toBe('foreign-ground');
  });

  it('refuses a taken field and a field off the board', () => {
    const placed = placeFigure(board, [], 'track-7');

    expect(refuseFigure(board, placed, 1, 'track-7')).toBe('occupied');
    expect(refuseFigure(board, [], 0, 'track-999')).toBe('unknown-field');
  });

  it('denies the wrong placement rather than making it', () => {
    expect(placeFigure(board, [], 'nest-1-0')).toHaveLength(0);
    expect(refuseNext(board, [], 'nest-1-0')).toBe('foreign-ground');
    expect(refuseNext(board, fill(16), 'track-1')).toBe('too-many');
  });

  it('validates a whole setting and names every fault', () => {
    const problems = validateSetting(board, [
      { player: 0, piece: 0, fieldId: 'nest-0-0' },
      { player: 0, piece: 1, fieldId: 'nest-1-0' },
      { player: 1, piece: 0, fieldId: 'goal-2-0' },
      { player: 2, piece: 0, fieldId: 'track-4' },
      { player: 3, piece: 0, fieldId: 'track-4' },
    ]);

    expect(problems.map((problem) => problem.reason)).toEqual([
      'foreign-ground',
      'foreign-ground',
      'occupied',
    ]);
  });

  it('holds a player to their own four figures', () => {
    const problems = validateSetting(
      board,
      Array.from({ length: 5 }, (_, piece) => ({
        player: 0,
        piece,
        fieldId: `track-${piece + 1}`,
      }))
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]?.reason).toBe('too-many');
  });

  it('passes a setting the board itself built', () => {
    expect(validateSetting(board, fill(16))).toEqual([]);
  });
});
