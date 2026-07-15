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
import { TranslateModule } from '@ngx-translate/core';
import { TColor, TIonDragEvent, TItemListCategory } from '../../types';
import { checkItemOptionsOnDrag } from '../../util/app.utils';

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
    TranslateModule,
  ],
})
export class CategoryItemComponent {
  category = input.required<TItemListCategory>();
  count = input.required<number>();
  ionList = input.required<IonList>();

  color = input<TColor>();

  selectCategory = output<void>();
  deleteCategory = output<void>();

  async handleItemOptionsOnDrag(ev: TIonDragEvent) {
    if (checkItemOptionsOnDrag(ev) === 'end') {
      return this.emitDeleteItem();
    }
    return undefined;
  }

  async emitDeleteItem() {
    await this.ionList().closeSlidingItems();
    this.deleteCategory.emit();
  }
}
