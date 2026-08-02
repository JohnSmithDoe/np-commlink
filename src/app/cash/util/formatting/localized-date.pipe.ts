import { Pipe, PipeTransform } from '@angular/core';
import { localizedDate } from '../../../@shared/util/formatting/date-format.utils';

@Pipe({ name: 'localizedDate' })
export class LocalizedDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? localizedDate(value) : '';
  }
}
