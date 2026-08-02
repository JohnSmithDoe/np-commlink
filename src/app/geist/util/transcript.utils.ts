import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import { GeistTurn } from '../model/geist.types';

type GeistTurnPatch = Partial<Omit<GeistTurn, 'id'>>;

type TranscriptView = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

const TAIL_SLACK_PX = 96;

export const patchTurn = (
  turns: readonly GeistTurn[],
  id: number,
  patch: GeistTurnPatch
): GeistTurn[] =>
  turns.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn));

export const appendAnswerChunk = (
  turns: readonly GeistTurn[],
  id: number,
  chunk: string
): GeistTurn[] =>
  turns.map((turn) =>
    turn.id === id ? { ...turn, answer: turn.answer + chunk } : turn
  );

export const noteForStreamError = (error: unknown): Marker =>
  error instanceof DOMException && error.name === 'AbortError'
    ? marker('geist.note.aborted')
    : marker('geist.note.failed');

export const isFollowingTail = (view: TranscriptView): boolean =>
  view.scrollHeight - view.scrollTop - view.clientHeight <= TAIL_SLACK_PX;
