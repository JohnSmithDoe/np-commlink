/* ─── why ─────────────────────────────────────────────────────────
 * One arm, rotated N times — the board IS its sector.
 *
 * An arm is a straight three-lane corridor: the outer lanes carry the
 * track, the middle one the goal column. Where neighbouring arms can MEET,
 * sharing the cell between one arm's inbound lane and the next one's
 * outbound lane, the inner radius is pinned to cot(π/N) — at four players
 * that is 1, which reproduces the classic 11×11 cross cell for cell.
 *
 * Sharing survives only for 3..6. Below it the goal columns collide on the
 * centre (2·cos(π/N) < 1); above it the two lanes leave the shared cell too
 * slowly and their flanking cells crowd (2·sin(π/N) < 1). Outside that
 * range the arms stand apart instead, pushed out until the flank measures
 * one pitch — which costs one further track field per player.
 * ───────────────────────────────────────────────────────────────── */

import {
  BoardField,
  BoardFieldId,
  BoardFieldKind,
  BoardLayout,
  BoardPlayerCount,
} from '../model/board.types';

const PIECES = 4;
const SHARE_MIN = 3;
const SHARE_MAX = 6;
const FIELD_RADIUS = 0.42;
const NEST_REACH = 1.4;
const NEST_PITCH = 1.05;
const FRAME_MARGIN = 0.6;
const PRECISION = 1000;

interface Point {
  x: number;
  y: number;
}

function sectorAngle(players: number): number {
  return (2 * Math.PI) / players;
}

function sharesCorner(players: number): boolean {
  return players >= SHARE_MIN && players <= SHARE_MAX;
}

function flankGap(players: number, inner: number): number {
  const reach = Math.hypot(1, inner);
  const spread = sectorAngle(players) - 2 * Math.atan(1 / inner);
  return 2 * reach * Math.sin(spread / 2);
}

function standoffInner(players: number): number {
  let crowded = 1 / Math.tan(Math.PI / players);
  let clear = crowded + 2 * players + 4;

  for (let pass = 0; pass < 60; pass++) {
    const mid = (crowded + clear) / 2;
    if (flankGap(players, mid) < 1) crowded = mid;
    else clear = mid;
  }

  return clear;
}

function armInner(players: number): number {
  return sharesCorner(players)
    ? 1 / Math.tan(Math.PI / players)
    : standoffInner(players);
}

function spin(point: Point, angle: number): Point {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function round(value: number): number {
  return Math.round(value * PRECISION) / PRECISION;
}

function field(
  id: BoardFieldId,
  kind: BoardFieldKind,
  player: number | null,
  index: number,
  at: Point
): BoardField {
  return { id, kind, player, index, x: round(at.x), y: round(at.y) };
}

function trackFields(players: number, inner: number): BoardField[] {
  const step = sectorAngle(players);
  const outer = inner + PIECES;
  const firstOutbound = sharesCorner(players) ? 1 : 0;
  const fields: BoardField[] = [];

  for (let player = 0; player < players; player++) {
    const own = player * step;
    const next = own + step;
    const sector: Point[] = [];

    for (let lane = PIECES; lane >= 0; lane--) {
      sector.push(spin({ x: 1, y: -(inner + lane) }, own));
    }
    for (let lane = firstOutbound; lane <= PIECES; lane++) {
      sector.push(spin({ x: -1, y: -(inner + lane) }, next));
    }
    sector.push(spin({ x: 0, y: -outer }, next));

    for (const [offset, at] of sector.entries()) {
      const index = player * sector.length + offset;
      const entry = offset === 0;
      fields.push(
        field(
          entry ? `start-${player}` : `track-${index}`,
          entry ? 'start' : 'track',
          entry ? player : null,
          index,
          at
        )
      );
    }
  }

  return fields;
}

function goalFields(players: number, inner: number): BoardField[] {
  const step = sectorAngle(players);
  const fields: BoardField[] = [];

  for (let player = 0; player < players; player++) {
    for (let lane = PIECES - 1; lane >= 0; lane--) {
      const index = PIECES - 1 - lane;
      fields.push(
        field(
          `goal-${player}-${index}`,
          'goal',
          player,
          index,
          spin({ x: 0, y: -(inner + lane) }, player * step)
        )
      );
    }
  }

  return fields;
}

function nestFields(players: number, inner: number): BoardField[] {
  const step = sectorAngle(players);
  const fields: BoardField[] = [];

  for (let player = 0; player < players; player++) {
    const bearing = player * step + step / 2;
    const centre = spin({ x: 0, y: -(inner + PIECES + NEST_REACH) }, bearing);

    for (let slot = 0; slot < PIECES; slot++) {
      const offset = spin(
        {
          x: (slot % 2 === 0 ? -0.5 : 0.5) * NEST_PITCH,
          y: (slot < 2 ? -0.5 : 0.5) * NEST_PITCH,
        },
        bearing
      );
      fields.push(
        field(`nest-${player}-${slot}`, 'nest', player, slot, {
          x: centre.x + offset.x,
          y: centre.y + offset.y,
        })
      );
    }
  }

  return fields;
}

function frame(fields: readonly BoardField[]): string {
  let far = 0;
  for (const at of fields) {
    far = Math.max(far, Math.abs(at.x), Math.abs(at.y));
  }

  const reach = far + FIELD_RADIUS + FRAME_MARGIN;
  const size = round(reach * 2);

  return `${round(-reach)} ${round(-reach)} ${size} ${size}`;
}

export function buildBoard(players: BoardPlayerCount): BoardLayout {
  const inner = armInner(players);
  const fieldsPerPlayer = 2 * (PIECES + 1) + (sharesCorner(players) ? 0 : 1);
  const fields = [
    ...trackFields(players, inner),
    ...goalFields(players, inner),
    ...nestFields(players, inner),
  ];

  return {
    players,
    pieces: PIECES,
    fieldsPerPlayer,
    trackLength: players * fieldsPerPlayer,
    radius: FIELD_RADIUS,
    viewBox: frame(fields),
    fields,
  };
}
