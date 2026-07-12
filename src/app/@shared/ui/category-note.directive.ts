import { Directive, ElementRef, inject, Input } from '@angular/core';
import { IBaseItem } from '../types';

@Directive({
  selector: '[appCategoryNote]',
  standalone: true,
})
export class CategoryNoteDirective {
  readonly #element = inject(ElementRef<HTMLIonNoteElement>);

  @Input()
  set appCategoryNote(val: IBaseItem | undefined) {
    if (val?.category?.length) {
      this.#element.nativeElement.style.display = 'block';
      this.#element.nativeElement.innerText = val.category.join(', ');
    } else {
      this.#element.nativeElement.style.display = 'none';
    }
  }
}
