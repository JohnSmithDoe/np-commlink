import { Pipe, PipeTransform } from '@angular/core';
import { padClock } from '../../@shared/util/formatting/date-format.utils';

export const trackTime = (ms: number | undefined): string => {
  if (ms === undefined || !Number.isFinite(ms) || ms < 0) return '–:––';
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = padClock(total % 60);
  return hours
    ? `${hours}:${padClock(minutes)}:${seconds}`
    : `${minutes}:${seconds}`;
};

@Pipe({ name: 'trackTime' })
export class TrackTimePipe implements PipeTransform {
  transform(ms: number | undefined): string {
    return trackTime(ms);
  }
}
