/* ─── why ─────────────────────────────────────────────────────────
 * The subdivision only stays a spiral while every cut alternates the
 * rectangle's orientation, which is the golden property itself — feed it 16:9
 * and the arc chain breaks apart. So the figure is built on a rectangle
 * DERIVED from the longer input side, and the caller's own rectangle is
 * returned beside it to draw as an overlay.
 *
 * Corners run TL, TR, BR, BL. With the square anchored at corner `c`, its arc
 * centre is corner (c+2)%4, its entry (c+3)%4 and its exit (c+1)%4 — so each
 * square's entry is the previous square's exit and the arcs chain without an
 * inflection. Traversed outer to inner the sweep flag is a constant 1.
 *
 * The sequence is SEEDED by orientation, because the first cut is vertical on
 * a landscape rectangle and horizontal on a portrait one. Start both at the
 * same corner and every joint in a portrait figure misses, which draws as
 * arcs flying out of the frame rather than as anything obviously wrong.
 * ───────────────────────────────────────────────────────────────── */
import { PHI, SPIRAL_STEPS } from '../model/golden.consts';

type GoldenSplit = { major: number; minor: number };

type SpiralSquare = {
  x: number;
  y: number;
  size: number;
  corner: number;
};

type SpiralPlan = {
  width: number;
  height: number;
  squares: SpiralSquare[];
  path: string;
};

export const goldenSplit = (total: number): GoldenSplit => {
  const major = total / PHI;
  return { major, minor: total - major };
};

export const goldenLadder = (
  base: number,
  up: number,
  down: number,
  offset: number = 0
): number[] =>
  Array.from(
    { length: up + down + 1 },
    (_, step) => base * PHI ** (step - down + offset)
  );

const cornerPoint = (
  square: SpiralSquare,
  corner: number
): [number, number] => {
  const { x, y, size } = square;
  switch (corner % 4) {
    case 0: {
      return [x, y];
    }
    case 1: {
      return [x + size, y];
    }
    case 2: {
      return [x + size, y + size];
    }
    default: {
      return [x, y + size];
    }
  }
};

export const spiralSquares = (
  width: number,
  height: number,
  steps: number = SPIRAL_STEPS
): SpiralPlan => {
  const landscape = width >= height;
  const outerWidth = landscape ? width : height / PHI;
  const outerHeight = landscape ? width / PHI : height;
  const seed = landscape ? 0 : 1;

  const squares: SpiralSquare[] = [];
  let left = 0;
  let top = 0;
  let boxWidth = outerWidth;
  let boxHeight = outerHeight;

  for (let step = 0; step < steps; step += 1) {
    const size = Math.min(boxWidth, boxHeight);
    if (size <= 0) break;

    const corner = (step + seed) % 4;
    const anchorLeft =
      corner === 1 || corner === 2 ? left + boxWidth - size : left;
    const anchorTop =
      corner === 2 || corner === 3 ? top + boxHeight - size : top;

    squares.push({ x: anchorLeft, y: anchorTop, size, corner });

    if (boxWidth >= boxHeight) {
      boxWidth -= size;
      if (corner === 0 || corner === 3) left += size;
    } else {
      boxHeight -= size;
      if (corner === 0 || corner === 1) top += size;
    }
  }

  const first = squares[0];
  if (!first) {
    return { width: outerWidth, height: outerHeight, squares, path: '' };
  }

  const [startX, startY] = cornerPoint(first, first.corner + 3);
  const arcs = squares.map((square) => {
    const [endX, endY] = cornerPoint(square, square.corner + 1);
    return `A ${square.size} ${square.size} 0 0 1 ${endX} ${endY}`;
  });

  return {
    width: outerWidth,
    height: outerHeight,
    squares,
    path: `M ${startX} ${startY} ${arcs.join(' ')}`,
  };
};

type GoldenPoint = {
  id: string;
  level: number;
  x: number;
  y: number;
  fromLeft: number;
  fromRight: number;
  fromTop: number;
  fromBottom: number;
};

type GoldenGuide = { value: number; level: number };

export const goldenGuides = (
  total: number,
  depth: number = 1
): GoldenGuide[] => {
  const guides: GoldenGuide[] = [];
  let spans = [[0, total] as const];

  for (let level = 1; level <= depth; level += 1) {
    const next: (readonly [number, number])[] = [];

    for (const [from, to] of spans) {
      const { major, minor } = goldenSplit(to - from);
      const near = from + minor;
      const far = from + major;

      guides.push({ value: near, level }, { value: far, level });
      next.push(
        [from, near] as const,
        [near, far] as const,
        [far, to] as const
      );
    }

    spans = next as typeof spans;
  }

  return guides.toSorted((a, b) => a.value - b.value);
};

export const goldenPoints = (
  width: number,
  height: number,
  depth: number = 1
): GoldenPoint[] => {
  const across = goldenGuides(width, depth);
  const down = goldenGuides(height, depth);

  return across
    .flatMap((x) =>
      down.map((y) => ({
        id: `${x.level}:${x.value}:${y.value}`,
        level: Math.max(x.level, y.level),
        x: x.value,
        y: y.value,
        fromLeft: x.value,
        fromRight: width - x.value,
        fromTop: y.value,
        fromBottom: height - y.value,
      }))
    )
    .toSorted((a, b) => a.level - b.level);
};
