import { Directive, effect, ElementRef, inject, input } from '@angular/core';
import { IBaseItem, ICategory } from '../types';
import { categoryNames } from '../util/category.utils';

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
