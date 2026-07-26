import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { IDataItem } from '../model/tracking.types';

@Pipe({
  name: 'timeFromDataItem',
  standalone: true,
})
export class TimeFromDataItemPipe implements PipeTransform {
  transform(item?: IDataItem, viewId?: string): string {
    if (viewId === 'all') return '';
    if (!item?.startTime) return '';
    const time = dayjs(item.startTime);
    if (!time.isValid()) return '';
    switch (viewId) {
      case 'daily':
      case 'today': {
        return time.format('DD.MM.YYYY');
      }
      case 'monthly': {
        return time.format('MM.YYYY');
      }
      default: {
        return time.format('DD.MM.YYYY HH:mm');
      }
    }
  }
}
