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
import { ItemReorderEventDetail } from '@ionic/angular';
import {
  IonLabel,
  IonList,
  IonListHeader,
  IonReorderGroup,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, cart, list, remove } from 'ionicons/icons';
import { IBaseItem } from '../../types';

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
    IonReorderGroup,
    IonLabel,
    IonListHeader,
    NgTemplateOutlet,
    FormsModule,
    TranslateModule,
  ],
})
export class ItemListComponent {
  readonly ionList = viewChild<IonList>('ionList');

  readonly itemTemplate =
    input.required<TemplateRef<ItemListTemplateContext>>();
  readonly items = input.required<(Array<IBaseItem> | null) | undefined>();
  readonly header = input<string>();
  readonly listHeader = input<boolean, unknown>(false, {
    transform: booleanAttribute,
  });
  readonly reorderDisabled = input(true);

  readonly reorder = output<ItemReorderEventDetail>();

  constructor() {
    addIcons({ add, remove, cart, list });
  }

  async closeSlidingItems() {
    await this.ionList()?.closeSlidingItems();
  }

  async handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    this.reorder.emit(ev.detail);
    // Finish the reorder and position the item in the DOM
    ev.detail.complete();
  }
}
