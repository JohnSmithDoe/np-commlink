import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import { IDataItem } from '../../types';

@Pipe({
  name: 'npTimeFromDataItem',
  standalone: true,
})
export class NpTimeFromDataItemPipe implements PipeTransform {
  transform(item?: IDataItem, viewId?: string): string {
    if (viewId === 'all') return '';
    if (!item?.startTime) return '';
    const time = dayjs(item.startTime);
    if (!time.isValid()) return '';
    switch (viewId) {
      case 'daily':
      case 'today':
        return time.format('DD.MM.YYYY');
      case 'monthly':
        return time.format('MM.YYYY');
      default:
        return time.format('DD.MM.YYYY HH:mm');
    }
  }
}
