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
import {
  IonLabel,
  IonList,
  IonListHeader,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TColor } from '../../../model/app.types';
import { IBaseItem } from '../../../model/base-item.types';
import { ICategory, TCategoryId } from '../../../model/category.types';
import { CategoryItemComponent } from '../../categories/category-item/category-item.component';

export type ItemListTemplateContext = {
  $implicit: IBaseItem;
  ionList: IonList | undefined;
  // The list's {id,name} catalog, so a projected row can resolve its item's
  // category ids → names (e.g. `<app-list-item [categories]="categories">`).
  categories: readonly ICategory[];
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
    category: ICategory;
    count: number;
  }> | null>();
  // The raw {id,name} catalog, threaded into each row's template context so a
  // projected `<app-list-item>` can resolve its item's category ids → names.
  readonly catalog = input<readonly ICategory[]>([]);
  readonly mode = input<'alphabetical' | 'categories'>('alphabetical');

  readonly selectCategory = output<TCategoryId>();
  readonly deleteCategory = output<TCategoryId>();

  async closeSlidingItems() {
    await this.ionList()?.closeSlidingItems();
  }
}
