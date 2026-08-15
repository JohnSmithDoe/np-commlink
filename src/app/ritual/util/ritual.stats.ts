/* ─── why ─────────────────────────────────────────────────────────
 * `completedAt` is local-format because `RitualActions.completed` runs
 * whatever it is handed back through `dayjs(at).format()` — a caller
 * cannot reach this file with a UTC instant and shift a late-evening
 * completion onto the following day. That is what makes the first ten
 * characters ARE the local calendar day, and slicing beats re-parsing:
 * the log only grows, and a dayjs construction per entry turns seven dots
 * into a full-history sweep every time the page opens.
 * ───────────────────────────────────────────────────────────────── */
import dayjs from 'dayjs';
import { RitualCompletion, RitualPromptId } from '../model/ritual.types';

const dayOf = (completion: RitualCompletion): string =>
  completion.completedAt.slice(0, 10);

export const recentPromptIds = (
  completions: readonly RitualCompletion[],
  count: number
): ReadonlySet<RitualPromptId> => {
  const ids = new Set<RitualPromptId>();
  for (
    let index = completions.length - 1;
    index >= 0 && ids.size < count;
    index--
  ) {
    ids.add(completions[index]!.promptId);
  }
  return ids;
};

export const completionOn = (
  completions: readonly RitualCompletion[],
  day: string
): RitualCompletion | undefined =>
  completions.findLast((entry) => dayOf(entry) === day);

export const recentDayFlags = (
  completions: readonly RitualCompletion[],
  today: string,
  days: number
): boolean[] => {
  const done = new Set(completions.map((entry) => dayOf(entry)));
  const latest = dayjs(today);
  return Array.from({ length: days }, (_, index) =>
    done.has(latest.subtract(days - 1 - index, 'day').format('YYYY-MM-DD'))
  );
};
