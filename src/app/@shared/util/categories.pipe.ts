import { Pipe, PipeTransform } from '@angular/core';
import { IBaseItem } from '../types';

@Pipe({
  name: 'appCategories',
  standalone: true,
})
export class CategoriesPipe implements PipeTransform {
  transform(value: IBaseItem | undefined, altText?: string) {
    return !value?.category ? (altText ?? '') : value.category.join(', ');
  }
}
