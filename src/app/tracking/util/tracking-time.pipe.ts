import { Pipe, PipeTransform } from '@angular/core';
import { ITrackingItem } from '../model/tracking.types';
import { formatSecondsAsClock } from './tracking.utils';

@Pipe({
  name: 'trackingTime',
  standalone: true,
})
export class TrackingTimePipe implements PipeTransform {
  // Anything carrying a tracked duration: a live session as much as an
  // aggregated stats row.
  transform(value?: Pick<ITrackingItem, 'trackedTimeInSeconds'>): string {
    return formatSecondsAsClock(value?.trackedTimeInSeconds ?? 0);
  }
}
