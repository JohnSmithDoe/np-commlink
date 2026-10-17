/* ─── why ─────────────────────────────────────────────────────────
 * A correction moves the tracked total and keeps `elapsed = tracked +
 * break` true, because a running timer recomputes its total from start
 * and break every tick — writing the total alone would be undone a
 * second later. Removing time grows the break; adding time spends the
 * break first and only then moves the start earlier.
 * ───────────────────────────────────────────────────────────────── */
import dayjs from 'dayjs';
import { TrackingItem } from '../model/tracking.types';

export const TRACKED_TIME_STEPS_IN_MINUTES = [-30, -15, -5, 5, 15, 30] as const;

export type TrackedDuration = {
  hours: number;
  minutes: number;
  seconds: number;
};

const setTrackedSeconds = (
  item: TrackingItem,
  seconds: number
): TrackingItem => {
  if (!item.startTime) return item;
  const target = Math.max(0, Math.trunc(seconds));
  const remainingBreak =
    (item.breakInSeconds ?? 0) - (target - (item.trackedTimeInSeconds ?? 0));

  return {
    ...item,
    trackedTimeInSeconds: target,
    breakInSeconds: Math.max(0, remainingBreak),
    startTime:
      remainingBreak < 0
        ? dayjs(item.startTime).add(remainingBreak, 'second').format()
        : item.startTime,
  };
};

export const adjustTrackedTime = (
  item: TrackingItem,
  deltaSeconds: number
): TrackingItem =>
  setTrackedSeconds(item, (item.trackedTimeInSeconds ?? 0) + deltaSeconds);

export const trackedDuration = (seconds: number): TrackedDuration => {
  return {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
};

export const setTrackedDuration = (
  item: TrackingItem,
  { hours, minutes, seconds }: TrackedDuration
): TrackingItem =>
  setTrackedSeconds(item, hours * 3600 + minutes * 60 + seconds);
