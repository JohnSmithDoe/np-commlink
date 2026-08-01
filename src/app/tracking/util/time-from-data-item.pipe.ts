import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { IDataItem, TTrackingViewId } from '../model/tracking.types';
import { formatViewDate } from './tracking.utils';

@Pipe({
  name: 'timeFromDataItem',
  standalone: true,
})
export class TimeFromDataItemPipe implements PipeTransform {
  transform(item?: IDataItem, viewId?: TTrackingViewId): string {
    if (!item?.startTime || !viewId) return '';
    if (!dayjs(item.startTime).isValid()) return '';
    return formatViewDate(item.startTime, viewId);
  }
}
