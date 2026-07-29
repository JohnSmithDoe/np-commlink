import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonReorder,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { TColor, TIonDragEvent } from '../../../model/app.types';
import { ICategory } from '../../../model/category.types';
import { revealedSideFromDrag } from '../../../util/app.utils';

@Component({
  selector: 'app-category-item',
  templateUrl: './category-item.component.html',
  styleUrls: ['./category-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonItem,
    IonLabel,
    IonReorder,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    NgTemplateOutlet,
    TranslatePipe,
  ],
})
export class CategoryItemComponent {
  category = input.required<ICategory>();
  count = input.required<number>();
  ionList = input.required<IonList>();

  color = input<TColor>();

  selectCategory = output<void>();
  deleteCategory = output<void>();

  async deleteOnSwipe(event: TIonDragEvent) {
    if (revealedSideFromDrag(event) === 'end') {
      return this.emitDeleteItem();
    }
    return;
  }

  async emitDeleteItem() {
    await this.ionList().closeSlidingItems();
    this.deleteCategory.emit();
  }
}
