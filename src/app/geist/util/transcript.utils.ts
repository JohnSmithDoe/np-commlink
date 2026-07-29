import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TMarker } from '../../@shared/model/app.types';
import { IGeistTurn } from '../model/geist.types';

type TGeistTurnPatch = Partial<Omit<IGeistTurn, 'id'>>;

/** The scroll box a transcript is read through, as far as following it needs. */
type TTranscriptView = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

// Fuzzy on purpose: the earliest a render hook can measure is once the new chunk
// is already in the box, so the distance it reports is at least that chunk's
// height. A couple of lines of slack keeps a streaming answer followed while a
// deliberate scroll up (which lands far higher) still wins.
const TAIL_SLACK_PX = 96;

/** A patch for a turn the user already purged is a no-op, not an error. */
export const patchTurn = (
  turns: readonly IGeistTurn[],
  id: number,
  patch: TGeistTurnPatch
): IGeistTurn[] =>
  turns.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn));

export const appendAnswerChunk = (
  turns: readonly IGeistTurn[],
  id: number,
  chunk: string
): IGeistTurn[] =>
  turns.map((turn) =>
    turn.id === id ? { ...turn, answer: turn.answer + chunk } : turn
  );

/** A stream the user stopped is not a failure — it gets its own note. */
export const noteForStreamError = (error: unknown): TMarker =>
  error instanceof DOMException && error.name === 'AbortError'
    ? marker('geist.note.aborted')
    : marker('geist.note.failed');

/** Whether the transcript is still parked at its tail, and so wants following. */
export const isFollowingTail = (view: TTranscriptView): boolean =>
  view.scrollHeight - view.scrollTop - view.clientHeight <= TAIL_SLACK_PX;
