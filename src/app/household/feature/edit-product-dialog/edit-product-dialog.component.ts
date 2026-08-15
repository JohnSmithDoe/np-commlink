import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  IonItem,
  IonSelect,
  IonSelectOption,
  IonText,
  SelectCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import {
  PRODUCTS_LIST_ID,
  BestBeforeTimespan,
  HouseholdListId,
  Product,
} from '../../model/household-list.types';
import { Marker } from '../../../@shared/model/app.types';
import { createProduct } from '../../util/household.factory';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { HouseholdCopyService, ProductsFacade } from '../../data';
import { BaseHouseholdEditItemDialog } from '../base-household-edit-item-dialog';

const TIMESPANS: readonly BestBeforeTimespan[] = [
  'forever',
  'days',
  'weeks',
  'months',
  'years',
];

const TIMESPAN_LABEL_KEYS: Record<BestBeforeTimespan, Marker> = {
  forever: marker('household.timespan.forever'),
  days: marker('household.timespan.days'),
  weeks: marker('household.timespan.weeks'),
  months: marker('household.timespan.months'),
  years: marker('household.timespan.years'),
};

@Component({
  selector: 'app-edit-product-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonItem,
    TranslatePipe,
    IonSelect,
    IonSelectOption,
    IonText,
    CategoryInputComponent,
    CategoriesDialogComponent,
    NumberInputComponent,
    ItemEditModalComponent,
  ],
  templateUrl: './edit-product-dialog.component.html',
})
export class EditProductDialogComponent extends BaseHouseholdEditItemDialog<Product> {
  protected blank(): Product {
    return createProduct('');
  }

  protected readonly listId: HouseholdListId = PRODUCTS_LIST_ID;
  readonly #products = inject(ProductsFacade);
  readonly #copy = inject(HouseholdCopyService);

  readonly siblings = this.#products.allItems;

  readonly timespans = TIMESPANS;
  readonly timespanLabelKeys = TIMESPAN_LABEL_KEYS;

  protected save(item: Product): void {
    this.#products.saveItem(item);
    const additional = this.addToAdditionalList();
    if (additional) this.#copy.addProductToList(additional, item);
  }

  setBestBeforeTimespan(event: SelectCustomEvent<BestBeforeTimespan>) {
    this.patch({
      bestBeforeTimespan: event.detail.value,
      bestBeforeTimevalue: event.detail.value === 'forever' ? undefined : 1,
    });
  }

  setBestBeforeTimevalue(value: number) {
    this.patch({ bestBeforeTimevalue: value });
  }
}
