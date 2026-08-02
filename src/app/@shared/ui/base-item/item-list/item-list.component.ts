import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  TemplateRef,
  viewChild,
} from '@angular/core';
import {
  IonLabel,
  IonList,
  IonListHeader,
  IonToolbar,
} from '@ionic/angular/standalone';
import { IonColor } from '../../../model/app.types';
import { BaseItem } from '../../../model/base-item.types';
import { Category } from '../../../model/category.types';

export type ItemListTemplateContext = {
  $implicit: BaseItem;
  ionList: IonList | undefined;
  categories: readonly Category[];
};

@Component({
  selector: 'app-item-list',
  templateUrl: 'item-list.component.html',
  styleUrls: ['item-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonToolbar, IonList, IonLabel, IonListHeader, NgTemplateOutlet],
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

  async closeSlidingItems() {
    await this.ionList()?.closeSlidingItems();
  }
}
