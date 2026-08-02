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
    if (!item?.startTime || !viewId) return '';
    if (!dayjs(item.startTime).isValid()) return '';
    return formatViewDate(item.startTime, viewId);
  }
}
