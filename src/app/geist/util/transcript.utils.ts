import { IGeistTurn } from '../model/geist.types';

type TGeistTurnPatch = Partial<Omit<IGeistTurn, 'id'>>;

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
