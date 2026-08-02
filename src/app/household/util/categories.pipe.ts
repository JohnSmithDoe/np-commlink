import { Pipe, PipeTransform } from '@angular/core';
import { categoryNames } from '../../@shared/util/categories/category.utils';
import { BaseItem } from '../../@shared/model/base-item.types';
import { Category } from '../../@shared/model/category.types';

@Pipe({
  name: 'categories',
})
export class CategoriesPipe implements PipeTransform {
  transform(value: BaseItem | undefined, catalog: readonly Category[] = []) {
    return categoryNames(value, catalog).join(', ');
  }
}
