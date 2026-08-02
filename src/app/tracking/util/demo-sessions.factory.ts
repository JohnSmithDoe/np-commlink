import dayjs from 'dayjs';
import { uuidv4 } from '../../@shared/util/app.utils';
import { TrackingItem } from '../model/tracking.types';

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

const randomDemoName = (): string =>
  DEMO_NAMES[upTo(DEMO_NAMES.length)] ?? DEMO_NAMES[0];

const randomSession = (start: dayjs.Dayjs, minutes: number): TrackingItem => ({
  id: uuidv4(),
  name: randomDemoName(),
  createdAt: start.format(),
  startTime: start.format(),
  trackedTimeInSeconds: minutes * 60,
  state: 'stopped',
});

const randomSessionsForDay = (day: dayjs.Dayjs): TrackingItem[] => {
  const sessions: TrackingItem[] = [];
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

export const createDemoSessions = (today = dayjs()): TrackingItem[] => {
  const generated: TrackingItem[] = [];
  for (let dayOffset = 0; dayOffset < DEMO_DAYS; dayOffset++) {
    generated.push(...randomSessionsForDay(today.subtract(dayOffset, 'day')));
  }
  return generated;
};
