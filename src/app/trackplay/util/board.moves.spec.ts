import { BoardFigure, BoardRules } from '../model/board.types';
import { buildBoard } from './board.factory';
import { planMove } from './board.moves';

const board = buildBoard(4);

const MADN: BoardRules = {
  entryRoll: 6,
  exactHome: true,
  jumpOwnInHome: false,
  throwOnLanding: true,
  blockOwn: false,
};

const at = (player: number, piece: number, fieldId: string): BoardFigure => ({
  player,
  piece,
  fieldId,
});

const move = (
  figures: BoardFigure[],
  from: string,
  pips: number,
  rules: BoardRules = MADN
) => planMove(board, rules, figures, from, pips);

describe('planMove', () => {
  it('walks the ring forward from the mover own start', () => {
    const plan = move([at(0, 0, 'start-0')], 'start-0', 3);

    expect(plan.ok && plan.to).toBe('track-3');
  });

  it('carries a piece across the seam into the next sector', () => {
    const plan = move([at(0, 0, 'track-8')], 'track-8', 5);

    expect(plan.ok && plan.to).toBe('track-13');
  });

  it('needs the entry roll to leave the yard', () => {
    expect(move([at(0, 0, 'nest-0-0')], 'nest-0-0', 3)).toEqual({
      ok: false,
      refusal: 'needs-six',
    });

    const out = move([at(0, 0, 'nest-0-0')], 'nest-0-0', 6);
    expect(out.ok && out.to).toBe('start-0');
  });

  it('turns into its own home column after a full lap', () => {
    const last = [at(1, 0, 'track-9')];

    expect(move(last, 'track-9', 1).ok && move(last, 'track-9', 1)).toEqual(
      expect.objectContaining({ to: 'goal-1-0' })
    );
    expect(move(last, 'track-9', 2)).toEqual(
      expect.objectContaining({ to: 'goal-1-1' })
    );
    expect(move(last, 'track-9', 4)).toEqual(
      expect.objectContaining({ to: 'goal-1-3' })
    );
    expect(move(last, 'track-9', 5)).toEqual({
      ok: false,
      refusal: 'overshoots-home',
    });
  });

  it('refuses to overshoot the home column', () => {
    expect(move([at(0, 0, 'goal-0-2')], 'goal-0-2', 3)).toEqual({
      ok: false,
      refusal: 'overshoots-home',
    });
  });

  it('never lands on your own piece', () => {
    const figures = [at(0, 0, 'track-3'), at(0, 1, 'track-5')];

    expect(move(figures, 'track-3', 2)).toEqual({
      ok: false,
      refusal: 'own-piece',
    });
  });

  it('throws an opponent home and takes the field', () => {
    const figures = [at(0, 0, 'track-3'), at(1, 0, 'track-5')];
    const plan = move(figures, 'track-3', 2);

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;

    expect(plan.to).toBe('track-5');
    expect(plan.thrown).toEqual(at(1, 0, 'nest-1-0'));
    expect(plan.figures).toContainEqual(at(0, 0, 'track-5'));
  });

  it('sends the thrown piece to the first free yard slot', () => {
    const figures = [
      at(1, 1, 'nest-1-0'),
      at(0, 0, 'track-3'),
      at(1, 0, 'track-5'),
    ];
    const plan = move(figures, 'track-3', 2);

    expect(plan.ok && plan.thrown?.fieldId).toBe('nest-1-1');
  });

  it('will not jump your own piece inside the home column', () => {
    const figures = [at(0, 0, 'goal-0-1'), at(0, 1, 'goal-0-3')];

    expect(move(figures, 'goal-0-3', 1)).toEqual({
      ok: false,
      refusal: 'overshoots-home',
    });
    expect(
      move([at(0, 0, 'goal-0-2'), at(0, 1, 'goal-0-0')], 'goal-0-0', 2)
    ).toEqual({ ok: false, refusal: 'blocked-in-home' });
  });

  it('refuses a roll no die can show, and an empty field', () => {
    expect(move([at(0, 0, 'track-3')], 'track-3', 7).ok).toBe(false);
    expect(move([at(0, 0, 'track-3')], 'track-3', 0).ok).toBe(false);
    expect(move([], 'track-3', 3)).toEqual({
      ok: false,
      refusal: 'no-figure',
    });
  });

  it('lets a loose count settle into the deepest slot still free', () => {
    const loose: BoardRules = { ...MADN, exactHome: false };
    const figures = [at(0, 0, 'goal-0-3'), at(0, 1, 'track-39')];

    const plan = move(figures, 'track-39', 6, loose);
    expect(plan.ok && plan.to).toBe('goal-0-2');

    const deeper = move([at(0, 0, 'track-39')], 'track-39', 6, loose);
    expect(deeper.ok && deeper.to).toBe('goal-0-3');
  });

  it('refuses a loose count once the home column is full behind it', () => {
    const loose: BoardRules = { ...MADN, exactHome: false };
    const full = [0, 1, 2, 3].map((piece) => at(0, piece, `goal-0-${piece}`));

    expect(move(full, 'goal-0-3', 2, loose)).toEqual({
      ok: false,
      refusal: 'overshoots-home',
    });
  });

  it('bends to the ruleset rather than to a second engine', () => {
    const pachisi: BoardRules = {
      ...MADN,
      blockOwn: true,
      jumpOwnInHome: true,
      throwOnLanding: false,
      entryRoll: 1,
    };
    const figures = [at(0, 0, 'track-3'), at(0, 1, 'track-5')];

    expect(move(figures, 'track-3', 2, pachisi).ok).toBe(true);
    expect(move([at(0, 0, 'nest-0-0')], 'nest-0-0', 1, pachisi).ok).toBe(true);

    const spare = [at(0, 0, 'track-3'), at(1, 0, 'track-5')];
    const plan = move(spare, 'track-3', 2, pachisi);
    expect(plan.ok && plan.thrown).toBeNull();
  });
});
