import { Pipe, PipeTransform } from '@angular/core';
import { IBaseItem, ICategory } from '../../model/types';
import { categoryNames } from './category.utils';

// Resolves an item's category IDs to a comma-joined name string against the
// list's {id,name} catalog. Usage: `item | appCategories: catalog` (with an
// optional 3rd `altText` shown when the item has no categories).
@Pipe({
  name: 'appCategories',
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
