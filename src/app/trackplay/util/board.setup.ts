/* ─── why ─────────────────────────────────────────────────────────
 * A yard and a home column belong to the player whose colour they carry;
 * the track is the only common ground on the board. So a figure may stand
 * on any track field and on nobody's private ground but its own — one rule,
 * and every way a figure reaches the board is made to ask it: the tap, the
 * yard button, and a pasted setting alike.
 * ───────────────────────────────────────────────────────────────── */

import { BoardField, BoardFigure, BoardLayout } from '../model/board.types';
import { TrackplayId } from '../model/trackplay.types';

export type PlacementRefusal =
  'unknown-field' | 'occupied' | 'foreign-ground' | 'too-many';

export function figureCount(layout: BoardLayout): number {
  return layout.players * layout.pieces;
}

export function nextFigure(
  layout: BoardLayout,
  placed: readonly BoardFigure[]
): Pick<BoardFigure, 'player' | 'piece'> | null {
  if (placed.length >= figureCount(layout)) return null;

  return {
    player: Math.floor(placed.length / layout.pieces),
    piece: placed.length % layout.pieces,
  };
}

export function homeFieldId(player: number, piece: number): TrackplayId {
  return `nest-${player}-${piece}`;
}

export function figureOn(
  placed: readonly BoardFigure[],
  fieldId: TrackplayId
): BoardFigure | undefined {
  return placed.find((figure) => figure.fieldId === fieldId);
}

function isPrivateGround(field: BoardField): boolean {
  return field.kind === 'nest' || field.kind === 'goal';
}

export function refuseFigure(
  layout: BoardLayout,
  placed: readonly BoardFigure[],
  player: number,
  fieldId: TrackplayId
): PlacementRefusal | null {
  const field = layout.fields.find((one) => one.id === fieldId);

  if (!field) return 'unknown-field';
  if (figureOn(placed, fieldId)) return 'occupied';
  if (isPrivateGround(field) && field.player !== player)
    return 'foreign-ground';

  return null;
}

export function refuseNext(
  layout: BoardLayout,
  placed: readonly BoardFigure[],
  fieldId: TrackplayId
): PlacementRefusal | null {
  const next = nextFigure(layout, placed);
  return next ? refuseFigure(layout, placed, next.player, fieldId) : 'too-many';
}

export function placeFigure(
  layout: BoardLayout,
  placed: readonly BoardFigure[],
  fieldId: TrackplayId
): readonly BoardFigure[] {
  const next = nextFigure(layout, placed);
  if (!next || refuseNext(layout, placed, fieldId)) return placed;

  return [...placed, { ...next, fieldId }];
}

export function validateSetting(
  layout: BoardLayout,
  figures: readonly BoardFigure[]
): { figure: BoardFigure; reason: PlacementRefusal }[] {
  const problems: { figure: BoardFigure; reason: PlacementRefusal }[] = [];
  const kept: BoardFigure[] = [];
  const used = new Map<number, number>();

  for (const figure of figures) {
    const held = used.get(figure.player) ?? 0;
    const reason =
      held >= layout.pieces
        ? 'too-many'
        : refuseFigure(layout, kept, figure.player, figure.fieldId);

    if (reason) {
      problems.push({ figure, reason });
      continue;
    }

    used.set(figure.player, held + 1);
    kept.push(figure);
  }

  return problems;
}

export function placeNextAtHome(
  layout: BoardLayout,
  placed: readonly BoardFigure[]
): readonly BoardFigure[] {
  const next = nextFigure(layout, placed);
  if (!next) return placed;

  return placeFigure(layout, placed, homeFieldId(next.player, next.piece));
}

export function takeBack(
  placed: readonly BoardFigure[]
): readonly BoardFigure[] {
  return placed.slice(0, -1);
}
