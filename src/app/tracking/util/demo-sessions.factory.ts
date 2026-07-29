import dayjs from 'dayjs';
import { uuidv4 } from '../../@shared/util/app.utils';
import { ITrackingItem } from '../model/tracking.types';

/**
 * The dev-only "generate dummy data" affordance: three weeks of plausible,
 * randomly generated work sessions. It lives here rather than in the reducer
 * because it is random and clock-bound — the reducer only merges the sessions
 * the action hands it.
 */

const DEMO_NAMES = [
  'Code review',
  'Standup',
  'Feature work',
  'Bug fixing',
  'Documentation',
  'Pair programming',
  'Email & Slack',
  'Deep work',
] as const;

const DEMO_DAYS = 21;
const DEMO_SESSIONS_PER_DAY_MIN = 2;
const DEMO_SESSIONS_PER_DAY_SPREAD = 3;
const DEMO_FIRST_HOUR = 8;
const DEMO_FIRST_HOUR_SPREAD = 2;
const DEMO_LAST_HOUR = 19;
const DEMO_MINUTES_MIN = 15;
const DEMO_MINUTES_SPREAD = 165;

const upTo = (spread: number): number => Math.floor(Math.random() * spread);

// The `?? DEMO_NAMES[0]` is unreachable — `upTo` never reaches `length` — and is
// there only because an index built at runtime is typed as possibly out of range.
const randomDemoName = (): string =>
  DEMO_NAMES[upTo(DEMO_NAMES.length)] ?? DEMO_NAMES[0];

const randomSession = (start: dayjs.Dayjs, minutes: number): ITrackingItem => ({
  id: uuidv4(),
  name: randomDemoName(),
  createdAt: start.format(),
  startTime: start.format(),
  trackedTimeInSeconds: minutes * 60,
  state: 'stopped',
});

// Walks the working day forward so the generated sessions never overlap, and
// stops once it would run past the evening.
const randomSessionsForDay = (day: dayjs.Dayjs): ITrackingItem[] => {
  const sessions: ITrackingItem[] = [];
  const count = DEMO_SESSIONS_PER_DAY_MIN + upTo(DEMO_SESSIONS_PER_DAY_SPREAD);
  let hour = DEMO_FIRST_HOUR + upTo(DEMO_FIRST_HOUR_SPREAD);
  for (let index = 0; index < count; index++) {
    const start = day.hour(hour).minute(upTo(50)).second(0);
    const minutes = DEMO_MINUTES_MIN + upTo(DEMO_MINUTES_SPREAD);
    sessions.push(randomSession(start, minutes));
    hour += 1 + Math.floor(minutes / 60);
    if (hour > DEMO_LAST_HOUR) break;
  }
  return sessions;
};

export const createDemoSessions = (today = dayjs()): ITrackingItem[] => {
  const generated: ITrackingItem[] = [];
  for (let dayOffset = 0; dayOffset < DEMO_DAYS; dayOffset++) {
    generated.push(...randomSessionsForDay(today.subtract(dayOffset, 'day')));
  }
  return generated;
};
