import { Directive, effect, ElementRef, inject, input } from '@angular/core';
import { categoryNames } from '../../util/categories/category.utils';
import { IBaseItem } from '../../model/base-item.types';
import { ICategory } from '../../model/category.types';

@Directive({
  selector: '[appCategoryNote]',
  standalone: true,
})
export class CategoryNoteDirective {
  readonly #element = inject(ElementRef<HTMLIonNoteElement>);

  readonly appCategoryNote = input<IBaseItem>();
  // The list's {id,name} catalog, so the item's category ids resolve to names.
  readonly appCategoryNoteCatalog = input<readonly ICategory[]>([]);

  constructor() {
    effect(() => {
      const names = categoryNames(
        this.appCategoryNote(),
        this.appCategoryNoteCatalog()
      );
      const element = this.#element.nativeElement;
      if (names.length > 0) {
        element.style.display = 'block';
        element.textContent = names.join(', ');
      } else {
        element.style.display = 'none';
      }
    });
  }
}
