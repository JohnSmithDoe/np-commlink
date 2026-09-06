/* ─── why ─────────────────────────────────────────────────────────
 * A piece walks ITS OWN lap, not the ring: `travelled + pips` decides
 * everything, and every rule the walk consults is DATA rather than a
 * constant in here ([domains.md](../../../../docs/domains.md)).
 * ───────────────────────────────────────────────────────────────── */

import {
  BoardField,
  BoardFieldId,
  BoardFigure,
  BoardLayout,
  BoardRules,
} from '../model/board.types';
import { figureOn, homeFieldId } from './board.setup';

const DIE_MIN = 1;
const DIE_MAX = 6;

export type MoveRefusal =
  | 'no-figure'
  | 'bad-roll'
  | 'needs-six'
  | 'overshoots-home'
  | 'own-piece'
  | 'blocked-in-home'
  | 'no-room-at-home';

type MovePlan =
  | {
      ok: true;
      to: BoardFieldId;
      figures: readonly BoardFigure[];
      thrown: BoardFigure | null;
    }
  | { ok: false; refusal: MoveRefusal };

type Landing =
  | { on: 'ring'; index: number }
  | { on: 'home'; slot: number }
  | { on: 'refused'; refusal: MoveRefusal };

const same = (a: BoardFigure, b: BoardFigure): boolean =>
  a.player === b.player && a.piece === b.piece;

function fieldOf(layout: BoardLayout, id: BoardFieldId): BoardField | null {
  return layout.fields.find((one) => one.id === id) ?? null;
}

function ringFieldAt(layout: BoardLayout, index: number): BoardField | null {
  return (
    layout.fields.find(
      (one) =>
        (one.kind === 'track' || one.kind === 'start') && one.index === index
    ) ?? null
  );
}

function startIndex(layout: BoardLayout, player: number): number {
  return player * layout.fieldsPerPlayer;
}

function deepestFreeSlot(
  layout: BoardLayout,
  figures: readonly BoardFigure[],
  player: number,
  first: number
): number | null {
  for (let slot = layout.pieces - 1; slot >= first; slot--) {
    if (!figureOn(figures, `goal-${player}-${slot}`)) return slot;
  }

  return null;
}

function landingOf(
  layout: BoardLayout,
  rules: BoardRules,
  figures: readonly BoardFigure[],
  figure: BoardFigure,
  field: BoardField,
  pips: number
): Landing {
  const start = startIndex(layout, figure.player);

  const homeLanding = (slot: number, first: number): Landing => {
    if (slot < layout.pieces) return { on: 'home', slot };
    if (rules.exactHome) return { on: 'refused', refusal: 'overshoots-home' };

    const absorbed = deepestFreeSlot(layout, figures, figure.player, first);
    return absorbed === null
      ? { on: 'refused', refusal: 'overshoots-home' }
      : { on: 'home', slot: absorbed };
  };

  if (field.kind === 'nest') {
    return pips === rules.entryRoll
      ? { on: 'ring', index: start }
      : { on: 'refused', refusal: 'needs-six' };
  }

  if (field.kind === 'goal') {
    return homeLanding(field.index + pips, field.index + 1);
  }

  const travelled =
    (field.index - start + layout.trackLength) % layout.trackLength;
  const total = travelled + pips;

  if (total < layout.trackLength) {
    return { on: 'ring', index: (start + total) % layout.trackLength };
  }

  return homeLanding(total - layout.trackLength, 0);
}

function homeRunBlocked(
  figures: readonly BoardFigure[],
  player: number,
  first: number,
  last: number
): boolean {
  for (let slot = first; slot <= last; slot++) {
    if (figureOn(figures, `goal-${player}-${slot}`)) return true;
  }

  return false;
}

function freeYardSlot(
  layout: BoardLayout,
  figures: readonly BoardFigure[],
  player: number
): BoardFieldId | null {
  for (let slot = 0; slot < layout.pieces; slot++) {
    const id = homeFieldId(player, slot);
    if (!figureOn(figures, id)) return id;
  }

  return null;
}

export function planMove(
  layout: BoardLayout,
  rules: BoardRules,
  figures: readonly BoardFigure[],
  from: BoardFieldId,
  pips: number
): MovePlan {
  if (!Number.isInteger(pips) || pips < DIE_MIN || pips > DIE_MAX) {
    return { ok: false, refusal: 'bad-roll' };
  }

  const mover = figureOn(figures, from);
  const field = fieldOf(layout, from);
  if (!mover || !field) return { ok: false, refusal: 'no-figure' };

  const landing = landingOf(layout, rules, figures, mover, field, pips);
  if (landing.on === 'refused') {
    return { ok: false, refusal: landing.refusal };
  }

  if (landing.on === 'home' && !rules.jumpOwnInHome) {
    const first = field.kind === 'goal' ? field.index + 1 : 0;
    if (homeRunBlocked(figures, mover.player, first, landing.slot)) {
      return { ok: false, refusal: 'blocked-in-home' };
    }
  }

  const target =
    landing.on === 'home'
      ? fieldOf(layout, `goal-${mover.player}-${landing.slot}`)
      : ringFieldAt(layout, landing.index);
  if (!target) return { ok: false, refusal: 'no-figure' };

  const sitting = figureOn(figures, target.id);
  if (sitting && sitting.player === mover.player && !rules.blockOwn) {
    return { ok: false, refusal: 'own-piece' };
  }

  const moved: BoardFigure = { ...mover, fieldId: target.id };
  if (!sitting || !rules.throwOnLanding || sitting.player === mover.player) {
    return {
      ok: true,
      to: target.id,
      thrown: null,
      figures: figures.map((one) => (same(one, mover) ? moved : one)),
    };
  }

  const yard = freeYardSlot(
    layout,
    figures.filter((one) => !same(one, sitting)),
    sitting.player
  );
  if (!yard) return { ok: false, refusal: 'no-room-at-home' };

  const thrown: BoardFigure = { ...sitting, fieldId: yard };

  return {
    ok: true,
    to: target.id,
    thrown,
    figures: figures.map((one) => {
      if (same(one, mover)) return moved;
      return same(one, sitting) ? thrown : one;
    }),
  };
}
