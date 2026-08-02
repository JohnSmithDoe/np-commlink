import { Pipe, PipeTransform } from '@angular/core';
import { TrackingItem } from '../model/tracking.types';
import { formatSecondsAsClock } from './tracking.utils';

@Pipe({
  name: 'trackingTime',
  standalone: true,
})
export class TrackingTimePipe implements PipeTransform {
  transform(value?: Pick<TrackingItem, 'trackedTimeInSeconds'>): string {
    return formatSecondsAsClock(value?.trackedTimeInSeconds ?? 0);
  }
}
