import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonNote } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { createOutline, pricetagsOutline } from 'ionicons/icons';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Category, CategoryId } from '../../../model/category.types';
import { CATALOG_FACADE } from '../../../util/categories/category-list.facade';
import { ListItemComponent } from '../../../ui/base-item/list-item/list-item.component';
import { StartSwipeAction } from '../../../ui/base-item/base-swipe-row';
import { EditCategoryDialogComponent } from '../edit-category-dialog/edit-category-dialog.component';
import { ListPageComponent } from '../../item-lists/list-page/list-page.component';

@Component({
  selector: 'app-page-category-list',
  templateUrl: './category-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonNote,
    TranslatePipe,
    ListPageComponent,
    ListItemComponent,
    EditCategoryDialogComponent,
  ],
})
export class CategoryListPage {
  readonly facade = inject(CATALOG_FACADE);

  readonly startSwipeAction: StartSwipeAction = {
    labelKey: marker('categories.a11y.rename'),
    icon: 'create-outline',
  };

  constructor() {
    addIcons({ createOutline, pricetagsOutline });
  }

  count(categoryId: CategoryId): number {
    return this.facade.countById().get(categoryId) ?? 0;
  }

  rename(category: Category): void {
    this.facade.showEditDialog(category);
  }
}
