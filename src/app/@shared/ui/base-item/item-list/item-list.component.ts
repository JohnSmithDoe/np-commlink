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
  IonReorderGroup,
  IonToolbar,
  ReorderEndCustomEvent,
} from '@ionic/angular/standalone';
import { IonColor } from '../../../model/app.types';
import { BaseItem } from '../../../model/base-item.types';
import { Category } from '../../../model/category.types';
import { reorderedIds } from '../../../util/app.utils';

export type ItemListTemplateContext = {
  $implicit: BaseItem;
  ionList: IonList | undefined;
  categories: readonly Category[];
  reorderable: boolean;
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
    IonReorderGroup,
    NgTemplateOutlet,
  ],
})
export class ItemListComponent {
  readonly ionList = viewChild<IonList>('ionList');

  readonly itemTemplate =
    input.required<TemplateRef<ItemListTemplateContext>>();
  readonly items = input.required<(Array<BaseItem> | null) | undefined>();
  readonly header = input<string>();
  readonly headerColor = input<IonColor>();
  readonly listHeader = input<boolean, unknown>(false, {
    transform: booleanAttribute,
  });
  readonly catalog = input<readonly Category[]>([]);
  readonly reorderable = input(false, { transform: booleanAttribute });

  readonly reorder = output<string[]>();

  async closeSlidingItems() {
    await this.ionList()?.closeSlidingItems();
  }

  onReorderEnd(event: ReorderEndCustomEvent): void {
    this.reorder.emit(reorderedIds(event, this.items() ?? []));
  }
}
