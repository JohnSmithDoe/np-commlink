import { BoardFigure } from '../model/board.types';
import { buildBoard } from './board.factory';
import {
  fieldNotation,
  formatGame,
  formatSetting,
  moveNotation,
  parseGame,
  notationOf,
  parseField,
  parseMove,
  parsePlacement,
  parseSetting,
  placementNotation,
} from './board.notation';

const board = buildBoard(4);
const wide = buildBoard(12);

const named = (fieldId: string) => notationOf(board, fieldId);

describe('board notation', () => {
  it('names a track field by whose stretch it is', () => {
    expect(named('start-0')).toBe('p1f0');
    expect(named('start-1')).toBe('p2f0');
    expect(named('track-9')).toBe('p1f9');
    expect(named('track-13')).toBe('p2f3');
  });

  it('names the home column and the yard apart from the track', () => {
    expect(named('goal-1-0')).toBe('p2h0');
    expect(named('goal-3-3')).toBe('p4h3');
    expect(named('nest-0-2')).toBe('p1b2');
  });

  it('leads with the player standing there, not the field owner', () => {
    const figure: BoardFigure = { player: 0, piece: 0, fieldId: 'track-13' };

    expect(placementNotation(board, figure)).toBe('p1-p2f3');
  });

  it('writes a move as an optional tail on the same token', () => {
    expect(moveNotation({ player: 0, field: 'p1f8', to: 'p2f2' })).toBe(
      'p1-p1f8-p2f2'
    );
  });

  it('says where a thrown-out piece lands, not merely that it was hit', () => {
    expect(
      moveNotation({
        player: 0,
        field: 'p1f8',
        to: 'p2f2',
        thrown: 'p2b0',
      })
    ).toBe('p1-p1f8-p2f2xp2b0');
  });

  it('throws a piece home and nowhere else', () => {
    expect(parseMove('p1-p1f8-p2f2xp2b0')?.thrown).toBe('p2b0');
    expect(parseMove('p1-p1f8-p2f2xp2f0')).toBeNull();
    expect(parseMove('p1-p1f8-p2f2xp2h0')).toBeNull();
  });

  it('reads a field back to the very same one', () => {
    for (const field of board.fields) {
      const back = parseField(board, fieldNotation(board, field));
      expect(back?.x).toBe(field.x);
      expect(back?.y).toBe(field.y);
    }
  });

  it('refuses a field no board has', () => {
    expect(parseField(board, 'p9f0')).toBeNull();
    expect(parseField(board, 'p1f10')).toBeNull();
    expect(parseField(board, 'nonsense')).toBeNull();
    expect(parseField(wide, 'p1f10')).not.toBeNull();
  });

  it('parses a placement and a move', () => {
    expect(parsePlacement('p1-p2f3')).toEqual({ player: 0, field: 'p2f3' });
    expect(parseMove('p1-p1f8-p2f2')).toEqual({
      player: 0,
      field: 'p1f8',
      to: 'p2f2',
    });
    expect(parseMove('p1-p2f3')).toBeNull();
  });

  it('replays a whole game out of one string', () => {
    const opening: BoardFigure[] = [
      { player: 0, piece: 0, fieldId: 'nest-0-0' },
      { player: 1, piece: 0, fieldId: 'nest-1-0' },
    ];
    const moves = [
      { player: 0, field: 'p1b0', to: 'p1f0' },
      { player: 1, field: 'p2b0', to: 'p2f0' },
      { player: 0, field: 'p1f0', to: 'p2f2', thrown: 'p2b0' },
    ];
    const text = formatGame(board, opening, moves);
    const back = parseGame(text, buildBoard(6));

    expect(text).toBe(
      'b4 p1-p1b0 p2-p2b0 p1-p1b0-p1f0 p2-p2b0-p2f0 p1-p1f0-p2f2xp2b0'
    );
    expect(back.layout.players).toBe(4);
    expect(back.figures).toEqual(opening);
    expect(back.moves).toEqual(moves);
    expect(back.rejected).toEqual([]);
  });

  it('carries the board in the exported header', () => {
    expect(formatSetting(board, [])).toBe('b4');
    expect(
      formatSetting(board, [{ player: 1, piece: 0, fieldId: 'nest-1-0' }])
    ).toBe('b4 p2-p2b0');
  });

  it('round-trips a whole setting through text', () => {
    const figures: BoardFigure[] = [
      { player: 0, piece: 0, fieldId: 'track-13' },
      { player: 0, piece: 1, fieldId: 'goal-0-1' },
      { player: 2, piece: 0, fieldId: 'nest-2-3' },
    ];
    const parsed = parseSetting(formatSetting(board, figures), board);

    expect(parsed.rejected).toEqual([]);
    expect(parsed.layout.players).toBe(4);
    expect(parsed.figures).toEqual(figures);
  });

  it('takes the board from the text, not from the board on screen', () => {
    const shared = formatSetting(wide, [
      { player: 11, piece: 0, fieldId: 'nest-11-0' },
    ]);
    const parsed = parseSetting(shared, board);

    expect(parsed.layout.players).toBe(12);
    expect(parsed.figures).toEqual([
      { player: 11, piece: 0, fieldId: 'nest-11-0' },
    ]);
  });

  it('keeps the readable half and reports the rest', () => {
    const parsed = parseSetting('b4 p1-p2f3 rubbish p1-p2f3 p9-p1f0', board);

    expect(parsed.figures).toHaveLength(1);
    expect(parsed.rejected).toEqual(['rubbish', 'p1-p2f3', 'p9-p1f0']);
  });

  it('falls back to the board on screen when the text names none', () => {
    const parsed = parseSetting('p1-p2f3', board);

    expect(parsed.layout.players).toBe(4);
    expect(parsed.figures).toHaveLength(1);
  });
});
