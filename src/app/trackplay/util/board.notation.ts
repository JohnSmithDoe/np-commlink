/* ─── why ─────────────────────────────────────────────────────────
 * `p1-p2f3` — player 1's figure, standing on field 3 of player 2's stretch.
 *
 * A field is named by WHOSE stretch of track it is, because that is how the
 * board is built: the ring is cut into one sector per player, so an offset
 * within a sector is a name any player reads off the board without counting
 * from a fixed origin. But a field name alone cannot say who is STANDING
 * there — every square is foreign ground to eleven of twelve players — so
 * the actor leads, always, and the rest of the token is where.
 *
 * Players count from 1 and fields from 0: the player number is spoken, the
 * offset is measured, and `p1f0` is exactly player 1's start field. `h`
 * names the home column a piece finishes in and `b` its yard — without them
 * leaving the yard and turning in to finish are the two moves that could not
 * be written down.
 *
 * `-` always separates, so `x` is free to mean one thing: someone was thrown
 * out, and this is where they land. It carries the victim's OWN yard field,
 * because whoever stood on the square is not derivable from the square — any
 * player can be anywhere. Spelling it out is what lets a game replay from the
 * text alone, with no board to consult.
 * ───────────────────────────────────────────────────────────────── */

import {
  BOARD_PLAYER_COUNTS,
  BoardField,
  BoardFieldId,
  BoardFigure,
  BoardLayout,
  BoardPlayerCount,
} from '../model/board.types';
import { buildBoard } from './board.factory';
import { refuseFigure } from './board.setup';

const TRACK = 'f';
const HOME = 'h';
const YARD = 'b';
const BOARD_PATTERN = /^b(\d+)$/;
const SEPARATORS = /[\s,;]+/;

const FIELD = String.raw`p\d+[fhb]\d+`;
const YARD_FIELD = String.raw`p\d+b\d+`;
const FIELD_PATTERN = /^p(\d+)([fhb])(\d+)$/;
const PLACE_PATTERN = new RegExp(String.raw`^p(\d+)-(${FIELD})$`);
const MOVE_PATTERN = new RegExp(
  String.raw`^p(\d+)-(${FIELD})-(${FIELD})(?:x(${YARD_FIELD}))?$`
);

interface BoardPlacement {
  player: number;
  field: string;
}

interface BoardMove extends BoardPlacement {
  to: string;
  thrown?: string;
}

interface ParsedSetting {
  layout: BoardLayout;
  figures: BoardFigure[];
  rejected: string[];
}

interface ParsedGame extends ParsedSetting {
  moves: BoardMove[];
}

export function fieldNotation(layout: BoardLayout, field: BoardField): string {
  const owner = (field.player ?? 0) + 1;
  if (field.kind === 'goal') return `p${owner}${HOME}${field.index}`;
  if (field.kind === 'nest') return `p${owner}${YARD}${field.index}`;

  const sector = Math.floor(field.index / layout.fieldsPerPlayer);
  return `p${sector + 1}${TRACK}${field.index % layout.fieldsPerPlayer}`;
}

export function notationOf(
  layout: BoardLayout,
  fieldId: BoardFieldId
): string | null {
  const field = layout.fields.find((one) => one.id === fieldId);
  return field ? fieldNotation(layout, field) : null;
}

export function placementNotation(
  layout: BoardLayout,
  figure: BoardFigure
): string | null {
  const field = notationOf(layout, figure.fieldId);
  return field ? `p${figure.player + 1}-${field}` : null;
}

function settingNotation(
  layout: BoardLayout,
  figures: readonly BoardFigure[]
): string[] {
  return figures.flatMap((figure) => {
    const placement = placementNotation(layout, figure);
    return placement ? [placement] : [];
  });
}

export function formatSetting(
  layout: BoardLayout,
  figures: readonly BoardFigure[]
): string {
  return [`b${layout.players}`, ...settingNotation(layout, figures)].join(' ');
}

function boardCountOf(token: string): BoardPlayerCount | null {
  const match = BOARD_PATTERN.exec(token);
  if (!match) return null;

  const players = Number(match[1]);
  return BOARD_PLAYER_COUNTS.includes(players as BoardPlayerCount)
    ? (players as BoardPlayerCount)
    : null;
}

function boardOf(tokens: string[]): BoardLayout | null {
  for (const token of tokens) {
    if (!BOARD_PATTERN.test(token)) continue;

    const players = boardCountOf(token);
    return players === null ? null : buildBoard(players);
  }

  return null;
}

export function parseSetting(
  text: string,
  fallback: BoardLayout
): ParsedSetting {
  const tokens = text.trim().toLowerCase().split(SEPARATORS).filter(Boolean);
  const layout = boardOf(tokens) ?? fallback;
  const figures: BoardFigure[] = [];
  const rejected: string[] = [];
  const used = new Map<number, number>();

  for (const token of tokens) {
    if (BOARD_PATTERN.test(token)) {
      if (boardCountOf(token) === null) rejected.push(token);
      continue;
    }

    const placement = parsePlacement(token);
    const field = placement ? parseField(layout, placement.field) : null;
    const piece = placement ? (used.get(placement.player) ?? 0) : 0;

    if (
      !placement ||
      !field ||
      placement.player < 0 ||
      placement.player >= layout.players ||
      piece >= layout.pieces ||
      refuseFigure(layout, figures, placement.player, field.id)
    ) {
      rejected.push(token);
      continue;
    }

    used.set(placement.player, piece + 1);
    figures.push({ player: placement.player, piece, fieldId: field.id });
  }

  return { layout, figures, rejected };
}

export function formatGame(
  layout: BoardLayout,
  figures: readonly BoardFigure[],
  moves: readonly BoardMove[]
): string {
  return [
    formatSetting(layout, figures),
    ...moves.map((move) => moveNotation(move)),
  ].join(' ');
}

export function parseGame(text: string, fallback: BoardLayout): ParsedGame {
  const tokens = text.trim().toLowerCase().split(SEPARATORS).filter(Boolean);
  const opening = parseSetting(
    tokens.filter((token) => !MOVE_PATTERN.test(token)).join(' '),
    fallback
  );
  const moves: BoardMove[] = [];

  for (const token of tokens) {
    const move = MOVE_PATTERN.test(token) ? parseMove(token) : null;
    if (move) moves.push(move);
  }

  return { ...opening, moves };
}

export function moveNotation(move: BoardMove): string {
  const thrown = move.thrown ? `x${move.thrown}` : '';
  return `p${move.player + 1}-${move.field}-${move.to}${thrown}`;
}

export function parseField(
  layout: BoardLayout,
  notation: string
): BoardField | null {
  const match = FIELD_PATTERN.exec(notation.trim().toLowerCase());
  if (!match) return null;

  const player = Number(match[1]) - 1;
  const slot = Number(match[3]);
  if (player < 0 || player >= layout.players) return null;

  if (match[2] === TRACK) {
    if (slot >= layout.fieldsPerPlayer) return null;
    const index = player * layout.fieldsPerPlayer + slot;
    return (
      layout.fields.find(
        (one) =>
          (one.kind === 'track' || one.kind === 'start') && one.index === index
      ) ?? null
    );
  }

  const kind = match[2] === HOME ? 'goal' : 'nest';
  return (
    layout.fields.find(
      (one) => one.kind === kind && one.player === player && one.index === slot
    ) ?? null
  );
}

export function parsePlacement(notation: string): BoardPlacement | null {
  const match = PLACE_PATTERN.exec(notation.trim().toLowerCase());
  if (!match) return null;

  const [, player, field] = match;
  if (!player || !field) return null;

  return { player: Number(player) - 1, field };
}

export function parseMove(notation: string): BoardMove | null {
  const match = MOVE_PATTERN.exec(notation.trim().toLowerCase());
  if (!match) return null;

  const [, player, field, to, thrown] = match;
  if (!player || !field || !to) return null;

  return thrown
    ? { player: Number(player) - 1, field, to, thrown }
    : { player: Number(player) - 1, field, to };
}
