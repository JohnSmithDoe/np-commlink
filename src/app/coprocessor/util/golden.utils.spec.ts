import { PHI } from '../model/golden.consts';
import {
  goldenGuides,
  goldenLadder,
  goldenPoints,
  goldenSplit,
  spiralSquares,
} from './golden.utils';

describe('goldenSplit', () => {
  it('splits a length into the two parts that make it whole', () => {
    const { major, minor } = goldenSplit(1920);

    expect(major).toBeCloseTo(1186.6, 1);
    expect(minor).toBeCloseTo(733.4, 1);
    expect(major + minor).toBeCloseTo(1920, 10);
  });

  it('divides the parts in the golden ratio', () => {
    const { major, minor } = goldenSplit(1920);
    expect(major / minor).toBeCloseTo(PHI, 10);
  });
});

describe('goldenLadder', () => {
  it('centres on the base and steps by phi in both directions', () => {
    const rungs = goldenLadder(16, 2, 2);

    expect(rungs).toHaveLength(5);
    expect(rungs[2]).toBeCloseTo(16, 10);
    for (const [index, rung] of rungs.slice(1).entries()) {
      expect(rung / rungs[index]!).toBeCloseTo(PHI, 10);
    }
  });

  it('interleaves a half step exactly between two whole ones', () => {
    const whole = goldenLadder(100, 3, 3);
    const half = goldenLadder(100, 3, 3, 0.5);

    for (const [index, rung] of half.entries()) {
      expect(rung).toBeGreaterThan(whole[index]!);
      if (whole[index + 1] !== undefined) {
        expect(rung).toBeLessThan(whole[index + 1]!);
        expect(rung).toBeCloseTo(
          Math.sqrt(whole[index]! * whole[index + 1]!),
          6
        );
      }
    }
  });

  it('rises monotonically', () => {
    const rungs = goldenLadder(16, 4, 4);
    expect(rungs).toEqual([...rungs].toSorted((a, b) => a - b));
  });
});

const corner = (
  square: { x: number; y: number; size: number },
  index: number
): [number, number] =>
  [
    [square.x, square.y],
    [square.x + square.size, square.y],
    [square.x + square.size, square.y + square.size],
    [square.x, square.y + square.size],
  ][index % 4] as [number, number];

describe('spiralSquares', () => {
  it('normalises to a golden rectangle regardless of the input ratio', () => {
    const plan = spiralSquares(1920, 1080);
    expect(plan.width / plan.height).toBeCloseTo(PHI, 10);
    expect(plan.width).toBe(1920);
  });

  it('normalises a portrait input off its longer side', () => {
    const plan = spiralSquares(1080, 1920);
    expect(plan.height).toBe(1920);
    expect(plan.height / plan.width).toBeCloseTo(PHI, 10);
  });

  it('shrinks every square', () => {
    const sizes = spiralSquares(1920, 1080).squares.map(
      (square) => square.size
    );
    for (const [index, size] of sizes.slice(1).entries()) {
      expect(size).toBeLessThan(sizes[index]!);
    }
  });

  it.each([
    [1920, 1080],
    [1080, 1920],
    [300, 240],
    [240, 300],
    [500, 500],
  ])('chains the arcs at %ix%i: each entry is the previous exit', (w, h) => {
    const { squares } = spiralSquares(w, h);

    for (const [index, square] of squares.slice(1).entries()) {
      const previous = squares[index]!;
      const [exitX, exitY] = corner(previous, previous.corner + 1);
      const [entryX, entryY] = corner(square, square.corner + 3);

      expect(entryX).toBeCloseTo(exitX, 6);
      expect(entryY).toBeCloseTo(exitY, 6);
    }
  });

  it.each([
    [1920, 1080],
    [1080, 1920],
    [240, 300],
  ])('keeps every square inside the figure at %ix%i', (w, h) => {
    const plan = spiralSquares(w, h);

    for (const square of plan.squares) {
      expect(square.x).toBeGreaterThanOrEqual(-1e-9);
      expect(square.y).toBeGreaterThanOrEqual(-1e-9);
      expect(square.x + square.size).toBeLessThanOrEqual(plan.width + 1e-9);
      expect(square.y + square.size).toBeLessThanOrEqual(plan.height + 1e-9);
    }
  });

  it('keeps every square inside the figure', () => {
    const plan = spiralSquares(1920, 1080);

    for (const square of plan.squares) {
      expect(square.x).toBeGreaterThanOrEqual(-1e-9);
      expect(square.y).toBeGreaterThanOrEqual(-1e-9);
      expect(square.x + square.size).toBeLessThanOrEqual(plan.width + 1e-9);
      expect(square.y + square.size).toBeLessThanOrEqual(plan.height + 1e-9);
    }
  });

  it('emits one arc per square', () => {
    const plan = spiralSquares(1920, 1080);
    expect(plan.path.match(/A /g)).toHaveLength(plan.squares.length);
  });
});

describe('goldenPoints', () => {
  it('places four points where the golden lines cross', () => {
    const points = goldenPoints(300, 200);

    expect(points).toHaveLength(4);
    expect(
      points.map((point) => point.fromLeft).toSorted((a, b) => a - b)[0]
    ).toBeCloseTo(114.59, 2);
    expect(
      points.map((point) => point.fromLeft).toSorted((a, b) => b - a)[0]
    ).toBeCloseTo(185.41, 2);
    expect(
      points.map((point) => point.fromTop).toSorted((a, b) => a - b)[0]
    ).toBeCloseTo(76.39, 2);
    expect(
      points.map((point) => point.fromTop).toSorted((a, b) => b - a)[0]
    ).toBeCloseTo(123.61, 2);
  });

  it('recurses into each span, and every deeper cut is golden too', () => {
    expect(goldenGuides(100, 1)).toHaveLength(2);
    expect(goldenGuides(100, 2)).toHaveLength(8);
    expect(goldenPoints(300, 200, 2)).toHaveLength(64);

    const deeper = goldenGuides(100, 2).filter((guide) => guide.level === 2);
    expect(deeper).toHaveLength(6);

    const edges = [0, ...goldenGuides(100, 1).map((g) => g.value), 100];
    for (const [index, from] of edges.slice(0, -1).entries()) {
      const to = edges[index + 1]!;
      const inside = deeper
        .filter((guide) => guide.value > from && guide.value < to)
        .map((guide) => guide.value);

      expect(inside).toHaveLength(2);
      expect((to - inside[0]!) / (inside[0]! - from)).toBeCloseTo(PHI, 6);
    }
  });

  it('measures each point from both edges, so a wall can be marked from either', () => {
    for (const point of goldenPoints(300, 200)) {
      expect(point.fromLeft + point.fromRight).toBeCloseTo(300, 9);
      expect(point.fromTop + point.fromBottom).toBeCloseTo(200, 9);
    }
  });

  it('cuts each axis in the golden ratio', () => {
    const [near, far] = goldenGuides(300).map((guide) => guide.value);
    expect(far! / near!).toBeCloseTo(PHI, 9);
    expect(near! + (300 - far!)).toBeCloseTo(2 * near!, 9);
  });
});
