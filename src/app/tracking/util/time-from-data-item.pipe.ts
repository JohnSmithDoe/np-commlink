import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { DataItem, TrackingViewId } from '../model/tracking.types';
import { formatViewDate } from './tracking.utils';

@Pipe({
  name: 'timeFromDataItem',
  standalone: true,
})
export class TimeFromDataItemPipe implements PipeTransform {
  transform(item?: DataItem, viewId?: TrackingViewId): string {
    return viewId && item?.startTime && dayjs(item.startTime).isValid()
      ? formatViewDate(item.startTime, viewId)
      : '';
  }
}
