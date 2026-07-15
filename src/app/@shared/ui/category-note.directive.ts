import { Directive, effect, ElementRef, inject, input } from '@angular/core';
import { IBaseItem } from '../types';

@Directive({
  selector: '[appCategoryNote]',
  standalone: true,
})
export class CategoryNoteDirective {
  readonly #element = inject(ElementRef<HTMLIonNoteElement>);

  readonly appCategoryNote = input<IBaseItem>();

  constructor() {
    effect(() => {
      const val = this.appCategoryNote();
      const el = this.#element.nativeElement;
      if (val?.category?.length) {
        el.style.display = 'block';
        el.innerText = val.category.join(', ');
      } else {
        el.style.display = 'none';
      }
    });
  }
}
