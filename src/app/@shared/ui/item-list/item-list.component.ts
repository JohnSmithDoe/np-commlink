import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonLabel,
  IonList,
  IonListHeader,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, cart, list, remove } from 'ionicons/icons';
import { IBaseItem, TColor, TItemListCategory } from '../../types';
import { CategoryItemComponent } from '../category-item/category-item.component';

export type ItemListTemplateContext = {
  $implicit: IBaseItem;
  ionList: IonList | undefined;
};

@Component({
  selector: 'app-item-list',
  templateUrl: 'item-list.component.html',
  styleUrls: ['item-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonToolbar,
    IonList,
    IonLabel,
    IonListHeader,
    NgTemplateOutlet,
    FormsModule,
    TranslateModule,
    CategoryItemComponent,
  ],
})
export class ItemListComponent {
  readonly ionList = viewChild<IonList>('ionList');

  readonly itemTemplate =
    input.required<TemplateRef<ItemListTemplateContext>>();
  readonly items = input.required<(Array<IBaseItem> | null) | undefined>();
  readonly header = input<string>();
  readonly headerColor = input<TColor>();
  readonly listHeader = input<boolean, unknown>(false, {
    transform: booleanAttribute,
  });
  // Grocery lists render either a flat item list or a category overview.
  readonly categories = input<ReadonlyArray<{
    category: TItemListCategory;
    count: number;
  }> | null>();
  readonly mode = input<'alphabetical' | 'categories'>('alphabetical');

  readonly selectCategory = output<TItemListCategory>();
  readonly deleteCategory = output<TItemListCategory>();

  constructor() {
    addIcons({ add, remove, cart, list });
  }

  async closeSlidingItems() {
    await this.ionList()?.closeSlidingItems();
  }
}
