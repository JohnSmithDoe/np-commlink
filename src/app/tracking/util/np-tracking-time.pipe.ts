import { Pipe, PipeTransform } from '@angular/core';
import { IDataItem } from '../model';

const pad = (value: number) => (value < 10 ? `0${value}` : value.toString());

@Pipe({
  name: 'npTrackingTime',
  standalone: true,
})
export class NpTrackingTimePipe implements PipeTransform {
  transform(value?: IDataItem): string {
    const total = Math.max(0, Math.floor(value?.trackedTimeInSeconds ?? 0));
    const hours = Math.floor(total / 3600);
    const min = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    return `${pad(hours)}:${pad(min)}:${pad(sec)}`;
  }
}
