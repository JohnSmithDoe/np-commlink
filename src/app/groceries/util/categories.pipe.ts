import { Pipe, PipeTransform } from '@angular/core';
import { categoryNames } from '../../@shared/util/categories/category.utils';
import { IBaseItem } from '../../@shared/model/base-item.types';
import { ICategory } from '../../@shared/model/category.types';

// Resolves an item's category IDs to a comma-joined name string against the
// list's {id,name} catalog. Usage: `item | categories: catalog` (with an
// optional 3rd `altText` shown when the item has no categories).
@Pipe({
  name: 'categories',
  standalone: true,
})
export class CategoriesPipe implements PipeTransform {
  transform(
    value: IBaseItem | undefined,
    catalog: readonly ICategory[] = [],
    altText?: string
  ) {
    const names = categoryNames(value, catalog);
    return names.length > 0 ? names.join(', ') : (altText ?? '');
  }
}
