import {
  BOARD_PLAYER_COUNTS,
  BoardField,
  BoardPlayerCount,
} from '../model/board.types';
import { buildBoard } from './board.factory';

const counts = [...BOARD_PLAYER_COUNTS];
const TWO_ROUNDED_COORDINATES = 0.002;

const byIndex = (a: BoardField, b: BoardField) => a.index - b.index;

const of = (kind: BoardField['kind'], players: BoardPlayerCount) =>
  buildBoard(players).fields.filter((field) => field.kind === kind);

const ring = (players: BoardPlayerCount) =>
  buildBoard(players)
    .fields.filter((field) => field.kind === 'track' || field.kind === 'start')
    .toSorted(byIndex);

const gap = (a: BoardField, b: BoardField) => Math.hypot(a.x - b.x, a.y - b.y);

const onGrid = (field: BoardField) => [
  Math.round(field.x + 5),
  Math.round(field.y + 5),
];

describe('buildBoard', () => {
  it.each(counts)('gives %i players one sector each', (players) => {
    const board = buildBoard(players);

    expect(board.fieldsPerPlayer).toBe(players >= 3 && players <= 6 ? 10 : 11);
    expect(board.trackLength).toBe(players * board.fieldsPerPlayer);
    expect(ring(players)).toHaveLength(board.trackLength);
  });

  it.each(counts)('seats every start one sector apart (%i)', (players) => {
    const board = buildBoard(players);
    const starts = of('start', players).toSorted(byIndex);

    expect(starts).toHaveLength(players);
    expect(starts.map((field) => field.index)).toEqual(
      Array.from(
        { length: players },
        (_, player) => player * board.fieldsPerPlayer
      )
    );
  });

  it.each(counts)('closes the ring at one pitch a step (%i)', (players) => {
    const fields = ring(players);

    for (const [index, field] of fields.entries()) {
      const step = gap(field, fields[(index + 1) % fields.length]);
      expect(Math.abs(step - 1)).toBeLessThan(TWO_ROUNDED_COORDINATES);
    }
  });

  it.each(counts)('lets no two fields share a spot (%i)', (players) => {
    const fields = buildBoard(players).fields;

    for (const [index, field] of fields.entries()) {
      for (const other of fields.slice(index + 1)) {
        expect(gap(field, other)).toBeGreaterThan(0.9);
      }
    }
  });

  it.each(counts)(
    'gives each player four goal and four nest fields (%i)',
    (players) => {
      expect(of('goal', players)).toHaveLength(players * 4);
      expect(of('nest', players)).toHaveLength(players * 4);
    }
  );

  it('reproduces the classic cross on the 11×11 grid', () => {
    const board = buildBoard(4);

    for (const field of board.fields.filter((one) => one.kind !== 'nest')) {
      const [col, row] = onGrid(field);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThanOrEqual(10);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThanOrEqual(10);
    }

    expect(
      ring(4)
        .slice(0, 10)
        .map((field) => onGrid(field))
    ).toEqual([
      [6, 0],
      [6, 1],
      [6, 2],
      [6, 3],
      [6, 4],
      [7, 4],
      [8, 4],
      [9, 4],
      [10, 4],
      [10, 5],
    ]);
  });

  it('runs the goal column inward from the ring', () => {
    const goal = of('goal', 4)
      .filter((field) => field.player === 0)
      .toSorted(byIndex);

    expect(goal.map((field) => onGrid(field))).toEqual([
      [5, 1],
      [5, 2],
      [5, 3],
      [5, 4],
    ]);
  });
});
